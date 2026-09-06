/**
 * Bearer-token auth for the JSON API under /api/*. Separate from the
 * human passcode cookie gate (src/proxy.ts), since API clients (e.g. the
 * MCP server) are non-interactive and need a stable, revocable credential.
 */
export function isAuthorizedApiRequest(request: Request): boolean {
  const expected = process.env.API_TOKEN;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token === expected;
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
