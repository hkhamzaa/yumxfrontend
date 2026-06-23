// In-memory rate limiter. Survives single-instance deployments (Vercel hobby / one dyno).
// Replace with an Upstash Redis-backed limiter if scaling horizontally.

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

/**
 * Returns true if the request should be allowed, false if rate-limited.
 * @param key        Unique key, e.g. `login:${ip}`
 * @param max        Maximum allowed attempts per window (default 5)
 * @param windowMs   Window duration in milliseconds (default 15 min)
 */
export function checkRateLimit(
  key: string,
  max = 5,
  windowMs = 15 * 60 * 1000,
): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count += 1
  return true
}

// Prune expired entries every 60 s to prevent unbounded growth
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) if (v.resetAt < now) store.delete(k)
}, 60_000)
