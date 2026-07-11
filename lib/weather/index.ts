import "server-only"
import { serverEnv } from "@/lib/env"
import { weatherBucket, type WeatherBucket } from "@/lib/recommendation-engine"

export type WeatherSnapshot = {
	main: string
	tempC: number
	bucket: WeatherBucket
	city: string
	fetchedAt: number
}

// In-memory cache per city. Plan section 7.3 recommends caching 15-30 min.
const CACHE_TTL_MS = 20 * 60 * 1000
const cache = new Map<string, WeatherSnapshot>()

/**
 * Fetch current weather for a city using OpenWeatherMap Current Weather Data
 * 2.5 (free, no card required - Plan section 7.3). Falls back to a neutral
 * snapshot when the key is missing or the request fails, so recommendations
 * keep working (graceful degradation).
 */
export async function getCurrentWeather(
	city: string,
	lat?: number,
	lon?: number,
): Promise<WeatherSnapshot> {
	const key = serverEnv.openWeatherKey
	const cacheKey = city || `${lat},${lon}`
	const cached = cache.get(cacheKey)
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached

	const neutral: WeatherSnapshot = {
		main: "Clear",
		tempC: 28,
		bucket: "neutral",
		city: city || "unknown",
		fetchedAt: Date.now(),
	}
	if (!key) return neutral

	try {
		const params = new URLSearchParams({
			appid: key,
			units: "metric",
			lang: "vi",
		})
		if (lat != null && lon != null) {
			params.set("lat", String(lat))
			params.set("lon", String(lon))
		} else {
			params.set("q", city)
		}
		const res = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?${params}`,
			{ next: { revalidate: 1200 } },
		)
		if (!res.ok) return neutral
		const data = (await res.json()) as {
			weather?: { main: string }[]
			main?: { temp: number }
			name?: string
		}
		const main = data.weather?.[0]?.main ?? "Clear"
		const tempC = data.main?.temp ?? 28
		const snapshot: WeatherSnapshot = {
			main,
			tempC,
			bucket: weatherBucket(main, tempC),
			city: data.name ?? city,
			fetchedAt: Date.now(),
		}
		cache.set(cacheKey, snapshot)
		return snapshot
	} catch {
		return neutral
	}
}
