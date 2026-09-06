/**
 * Best-effort in-memory rate limiter for the login passcode form. This is
 * NOT sufficient on its own for a serverless deployment: Vercel functions
 * are not guaranteed to share memory across invocations/regions, so a
 * distributed attacker (or even a single attacker hitting a cold-started
 * instance) can bypass an in-memory counter. Treat this as defense in
 * depth, not the real control. For real protection, put a proper rate
 * limiter in front (Vercel WAF rate limiting, or Upstash/Redis-backed
 * limiting keyed by IP), and prefer a long random passcode over a short
 * numeric PIN.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 5;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS_PER_WINDOW;
}
