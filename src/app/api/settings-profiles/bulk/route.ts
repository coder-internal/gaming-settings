import { prisma } from "@/lib/prisma";
import { isAuthorizedApiRequest, unauthorizedResponse } from "@/lib/api-auth";
import { validateProfileInput } from "@/lib/settings-profile-input";
import { parseJsonBody } from "@/lib/parse-json-body";

export const dynamic = "force-dynamic";

const MAX_BULK_SIZE = 500;

/**
 * Upserts many curated settings profiles in one call, e.g. after a batch
 * research pass covering N games x M computers. Body: { profiles: [...] }.
 * Each entry uses the same shape as POST /api/settings-profiles. Processes
 * sequentially and reports per-item success/failure rather than failing the
 * whole batch on one bad entry.
 */
export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorizedResponse();

  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) return Response.json({ error: parseError }, { status: 400 });

  const list = (body as { profiles?: unknown[] })?.profiles;
  if (!Array.isArray(list) || list.length === 0) {
    return Response.json({ error: "Body must be { profiles: [...] } with at least one entry." }, { status: 400 });
  }
  if (list.length > MAX_BULK_SIZE) {
    return Response.json(
      { error: `Body must contain at most ${MAX_BULK_SIZE} profiles per request.` },
      { status: 400 }
    );
  }

  const results: Array<{ index: number; ok: boolean; error?: string; id?: string }> = [];

  for (let index = 0; index < list.length; index++) {
    const { data, error } = validateProfileInput(list[index]);
    if (error || !data) {
      results.push({ index, ok: false, error: error ?? "Unknown validation error." });
      continue;
    }
    try {
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
      results.push({ index, ok: true, id: profile.id });
    } catch (e) {
      results.push({ index, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return Response.json({ succeeded, failed: results.length - succeeded, results });
}
