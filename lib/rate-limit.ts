/**
 * Very small in-memory sliding-window rate limiter for guest order creation
 * (Plan section 8.4). Keyed by table/device/IP. For multi-instance production,
 * swap the Map for Redis/Upstash - the interface stays the same.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(
	key: string,
	limit = 5,
	windowMs = 60_000,
): { allowed: boolean; remaining: number } {
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
