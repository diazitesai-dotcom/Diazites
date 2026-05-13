/**
 * In-memory per-IP token bucket. Suitable for a single-instance Node process
 * (or as a first defense before a real edge / Redis-backed limiter).
 *
 * Each bucket key gets `capacity` tokens that refill at `refillPerSecond`.
 * Calls to `check` deduct one token; if the bucket is empty the call is
 * rejected and a `retryAfterSeconds` is suggested.
 */
type Bucket = {
  tokens: number;
  lastRefill: number;
};

const BUCKETS = new Map<string, Bucket>();

export type RateLimitOptions = {
  capacity: number;
  refillPerSecond: number;
};

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { capacity: 10, refillPerSecond: 0.2 },
): RateLimitResult {
  const now = Date.now();
  const existing = BUCKETS.get(key);
  const tokens = existing?.tokens ?? options.capacity;
  const lastRefill = existing?.lastRefill ?? now;

  const elapsedSec = Math.max(0, (now - lastRefill) / 1000);
  const refill = elapsedSec * options.refillPerSecond;
  const refilled = Math.min(options.capacity, tokens + refill);

  if (refilled < 1) {
    BUCKETS.set(key, { tokens: refilled, lastRefill: now });
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((1 - refilled) / options.refillPerSecond),
    );
    return { allowed: false, retryAfterSeconds };
  }

  const next = refilled - 1;
  BUCKETS.set(key, { tokens: next, lastRefill: now });
  return { allowed: true, remaining: Math.floor(next) };
}

/**
 * Best-effort client IP extraction. Falls back to an "anonymous" key so we
 * still rate-limit when headers are missing (e.g. local dev).
 */
export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "anonymous";
}
