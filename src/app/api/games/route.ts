import { prisma } from "@/lib/prisma";
import { isAuthorizedApiRequest, unauthorizedResponse } from "@/lib/api-auth";

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

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const platform = String(body.platform ?? "OTHER");
  const notes = body.notes ? String(body.notes).trim() : null;
  const steamAppId = body.steamAppId != null ? Number(body.steamAppId) : null;
  const xboxTitleId = body.xboxTitleId ? String(body.xboxTitleId) : null;

  if (!name) {
    return Response.json({ error: "name is required." }, { status: 400 });
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
