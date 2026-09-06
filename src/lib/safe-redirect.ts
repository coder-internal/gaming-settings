/**
 * Validates that a redirect target is a same-app relative path, not an
 * absolute or protocol-relative URL. Guards against open-redirect payloads
 * like "//evil.com" or "/\evil.com", which pass a naive `startsWith("/")`
 * check but browsers resolve as an off-site, scheme-relative URL.
 */
export function safeRedirectPath(candidate: unknown, fallback = "/"): string {
  if (typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  return candidate;
}
