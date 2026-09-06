import { timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "gs_session";

/**
 * Constant-time string comparison to avoid leaking how many leading
 * characters of a secret matched via response-timing differences. Pads to
 * equal length first so timingSafeEqual (which requires equal-length
 * buffers) never throws or short-circuits on length alone.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a same-length comparison so the operation takes
    // comparable time whether or not lengths match.
    timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Each deployment (fork) of this app is single-user, so a shared passcode
 * scoped to that one deployment is enough. The cookie value is the
 * passcode itself, set httpOnly so it never touches client JS. This
 * intentionally trades off a full multi-user auth system for simplicity:
 * if you want your own instance, fork the repo and set your own
 * APP_PASSCODE rather than sharing this deployment's passcode.
 */
export function isValidPasscode(candidate: string | undefined | null): boolean {
  const expected = process.env.APP_PASSCODE;
  if (!expected) {
    throw new Error("APP_PASSCODE environment variable is not set.");
  }
  return !!candidate && timingSafeStringEqual(candidate, expected);
}
