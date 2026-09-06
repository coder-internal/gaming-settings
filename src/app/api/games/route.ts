import { prisma } from "@/lib/prisma";
import { isAuthorizedApiRequest, unauthorizedResponse } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/parse-json-body";

export const dynamic = "force-dynamic";

/**
 * JSON API for programmatic access (e.g. the MCP server), separate from the
 * passcode-gated HTML app. Auth is a static Bearer token (API_TOKEN env var).
 */
export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorizedResponse();

  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });
  return Response.json({ games });
}

export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorizedResponse();

  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) return Response.json({ error: parseError }, { status: 400 });
  const b = body as Record<string, unknown>;

  const name = String(b.name ?? "").trim();
  const platform = String(b.platform ?? "OTHER");
  const notes = b.notes ? String(b.notes).trim() : null;
  const steamAppId = b.steamAppId != null ? Number(b.steamAppId) : null;
  const xboxTitleId = b.xboxTitleId ? String(b.xboxTitleId) : null;

  if (!name) {
    return Response.json({ error: "name is required." }, { status: 400 });
  }
  if (steamAppId != null && !Number.isFinite(steamAppId)) {
    return Response.json({ error: "steamAppId must be a number." }, { status: 400 });
  }
  if (!["STEAM", "XBOX", "OTHER"].includes(platform)) {
    return Response.json(
      { error: "platform must be one of STEAM, XBOX, OTHER." },
      { status: 400 }
    );
  }

  const game = await prisma.game.create({
    data: { name, platform: platform as "STEAM" | "XBOX" | "OTHER", notes, steamAppId, xboxTitleId },
  });

  return Response.json({ game }, { status: 201 });
}
