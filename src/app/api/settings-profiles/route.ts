import { prisma } from "@/lib/prisma";
import { isAuthorizedApiRequest, unauthorizedResponse } from "@/lib/api-auth";
import { validateProfileInput } from "@/lib/settings-profile-input";

export const dynamic = "force-dynamic";

/**
 * Lists settings profiles, optionally filtered by gameId and/or computerId.
 * Query params: gameId, computerId (both optional).
 */
export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId") ?? undefined;
  const computerId = searchParams.get("computerId") ?? undefined;

  const profiles = await prisma.settingsProfile.findMany({
    where: { gameId, computerId },
    include: { game: true, computer: true },
    orderBy: [{ gameId: "asc" }, { computerId: "asc" }],
  });

  return Response.json({ profiles });
}

/** Upserts a single curated settings profile (see ProfileInput for shape). */
export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorizedResponse();

  const body = await request.json();
  const { data, error } = validateProfileInput(body);
  if (error || !data) return Response.json({ error: error ?? "Unknown validation error." }, { status: 400 });

  const profile = await prisma.settingsProfile.upsert({
    where: {
      gameId_computerId_targetResolution_targetFps: {
        gameId: data.gameId,
        computerId: data.computerId,
        targetResolution: data.targetResolution,
        targetFps: data.targetFps,
      },
    },
    update: { settings: data.settings, notes: data.notes, source: "CURATED" },
    create: { ...data, source: "CURATED" },
  });

  return Response.json({ profile }, { status: 200 });
}
