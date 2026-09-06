import { timingSafeEqual } from "node:crypto";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Bearer-token auth for the JSON API under /api/*. Separate from the
 * human passcode cookie gate (src/proxy.ts), since API clients (e.g. the
 * MCP server) are non-interactive and need a stable, revocable credential.
 */
export function isAuthorizedApiRequest(request: Request): boolean {
  const expected = process.env.API_TOKEN;
  if (!expected) return false;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`api:${ip}`)) return false;

  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;

  // Constant-time comparison: avoid leaking how many leading characters of
  // API_TOKEN matched via response-timing differences.
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (tokenBuf.length !== expectedBuf.length) {
    timingSafeEqual(tokenBuf, Buffer.alloc(tokenBuf.length));
    return false;
  }
  return timingSafeEqual(tokenBuf, expectedBuf);
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
