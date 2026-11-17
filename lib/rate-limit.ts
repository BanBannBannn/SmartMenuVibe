/**
 * Fixed-window rate limiter for guest order creation (Plan section 8.4).
 *
 * With UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set, counters live in
 * Upstash Redis (REST API, no extra dependency), so the limit holds across all
 * serverless instances. Without them - or if Redis is unreachable - it falls
 * back to a per-instance in-memory Map, which is fine for local dev but leaky
 * on Vercel because each instance has its own memory.
 */

type Result = { allowed: boolean; remaining: number }
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function memoryLimit(key: string, limit: number, windowMs: number): Result {
	const now = Date.now()
	const b = buckets.get(key)
	if (!b || now > b.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + windowMs })
		return { allowed: true, remaining: limit - 1 }
	}
	if (b.count >= limit) return { allowed: false, remaining: 0 }
	b.count += 1
	return { allowed: true, remaining: limit - b.count }
}

async function redisCount(
	url: string,
	token: string,
	key: string,
	windowMs: number,
): Promise<number> {
	// INCR then set the expiry only on the first hit of the window (NX).
	const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify([
			["INCR", key],
			["PEXPIRE", key, String(windowMs), "NX"],
		]),
		cache: "no-store",
		signal: AbortSignal.timeout(1500),
	})
	if (!res.ok) throw new Error(`UPSTASH_${res.status}`)
	const data = (await res.json()) as { result?: unknown; error?: string }[]
	const count = Number(data[0]?.result)
	if (!Number.isFinite(count)) throw new Error(data[0]?.error ?? "UPSTASH_BAD_REPLY")
	return count
}

export async function rateLimit(
	key: string,
	limit = 5,
	windowMs = 60_000,
): Promise<Result> {
	const url = process.env.UPSTASH_REDIS_REST_URL
	const token = process.env.UPSTASH_REDIS_REST_TOKEN
	if (url && token) {
		try {
			const count = await redisCount(url, token, `rl:${key}`, windowMs)
			return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
		} catch (err) {
			console.warn("[rate-limit] Redis unavailable, using memory:", err)
		}
	}
	return memoryLimit(key, limit, windowMs)
}
