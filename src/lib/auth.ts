export const SESSION_COOKIE = "gs_session";

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
  return !!candidate && candidate === expected;
}
