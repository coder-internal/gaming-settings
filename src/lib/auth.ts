export const SESSION_COOKIE = "gs_session";

/**
 * Personal, single-user app: a shared passcode is enough. The cookie value
 * is the passcode itself, set httpOnly so it never touches client JS. This
 * intentionally trades off a full auth system for simplicity, since the app
 * has exactly one user.
 */
export function isValidPasscode(candidate: string | undefined | null): boolean {
  const expected = process.env.APP_PASSCODE;
  if (!expected) {
    throw new Error("APP_PASSCODE environment variable is not set.");
  }
  return !!candidate && candidate === expected;
}
