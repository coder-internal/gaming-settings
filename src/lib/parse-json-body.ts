/**
 * Parses a JSON request body, returning a typed error result instead of
 * throwing on malformed JSON (empty body, truncated body, non-JSON
 * content-type, etc). Route handlers previously called `request.json()`
 * directly, which throws SyntaxError on bad input and surfaces as an
 * unhandled 500 rather than a clean 400.
 */
export async function parseJsonBody(
  request: Request
): Promise<{ data: unknown; error?: undefined } | { data?: undefined; error: string }> {
  const text = await request.text();
  if (!text) return { error: "Request body must be valid JSON." };
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { error: "Request body must be valid JSON." };
  }
}
