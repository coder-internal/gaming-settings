import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  SETTINGS_SECTIONS,
  RESOLUTION_OPTIONS,
  FPS_OPTIONS,
  type StructuredSettings,
} from "@/lib/settings-sections";
import { AutoSubmitSelect } from "./AutoSubmitSelect";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toggleFavorite } from "./actions";

const RESOLUTION_ORDER: string[] = RESOLUTION_OPTIONS.map((r) => r.value);
const RESOLUTION_LABELS: Record<string, string> = Object.fromEntries(
  RESOLUTION_OPTIONS.map((r) => [r.value, r.label])
);

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{
    gameId?: string;
    computerId?: string;
    resolution?: string;
    fps?: string;
  }>;
}) {
  const params = await searchParams;
  const [games, computers] = await Promise.all([
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.computer.findMany({ orderBy: { name: "asc" } }),
  ]);

  const hasSelection = Boolean(params.gameId && params.computerId);

  // Every curated profile for this exact (game, computer) pair, used to
  // narrow the resolution/FPS dropdowns to combinations that actually exist
  // instead of the full static list, which used to let you pick a
  // resolution/FPS with nothing curated and land on a dead end.
  const candidateProfiles = hasSelection
    ? await prisma.settingsProfile.findMany({
        where: { gameId: params.gameId, computerId: params.computerId },
        select: { targetResolution: true, targetFps: true },
      })
    : [];

  const curatedResolutions = [...new Set(candidateProfiles.map((p) => p.targetResolution))].sort(
    (a, b) => RESOLUTION_ORDER.indexOf(a) - RESOLUTION_ORDER.indexOf(b)
  );
  const hasCuratedData = curatedResolutions.length > 0;

  // Resolution: prefer the requested one if it's actually curated, else the
  // first curated option. With no curated data yet for this pair, fall back
  // to the full static list so "add the first profile" is still possible.
  const targetResolution = hasCuratedData
    ? curatedResolutions.includes(params.resolution ?? "")
      ? (params.resolution as string)
      : curatedResolutions[0]
    : params.resolution || "3840x2160";

  const curatedFps = [
    ...new Set(
      candidateProfiles
        .filter((p) => p.targetResolution === targetResolution)
        .map((p) => p.targetFps)
    ),
  ].sort((a, b) => b - a);

  const targetFps = hasCuratedData
    ? curatedFps.includes(Number(params.fps))
      ? Number(params.fps)
      : curatedFps[0]
    : Number(params.fps || 120);

  const resolutionOptions = hasCuratedData
    ? curatedResolutions.map((value) => ({ value, label: RESOLUTION_LABELS[value] ?? value }))
    : RESOLUTION_OPTIONS;
  const fpsOptions = hasCuratedData ? curatedFps : FPS_OPTIONS;

  let profile = null;
  if (hasSelection) {
    profile = await prisma.settingsProfile.findUnique({
      where: {
        gameId_computerId_targetResolution_targetFps: {
          gameId: params.gameId!,
          computerId: params.computerId!,
          targetResolution,
          targetFps,
        },
      },
      include: { game: true, computer: true },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Recommend settings</h2>

      {(games.length === 0 || computers.length === 0) && (
        <p className="text-sm text-slate-400">
          Add at least one game and one computer before requesting a
          recommendation.
        </p>
      )}

      <form method="get" noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Game</span>
          <SearchableSelect
            name="gameId"
            options={games}
            defaultValue={params.gameId ?? ""}
            placeholder="Select a game"
            searchPlaceholder="Search games..."
            autoSubmit
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Computer</span>
          <AutoSubmitSelect
            name="computerId"
            defaultValue={params.computerId ?? ""}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none"
          >
            <option value="" disabled>
              Select a computer
            </option>
            {computers.map((computer) => (
              <option key={computer.id} value={computer.id}>
                {computer.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-400">Target resolution</span>
            <AutoSubmitSelect
              name="resolution"
              defaultValue={targetResolution}
              disabled={!hasSelection}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none disabled:opacity-50"
            >
              {resolutionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AutoSubmitSelect>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-400">Target FPS</span>
            <AutoSubmitSelect
              name="fps"
              defaultValue={String(targetFps)}
              disabled={!hasSelection}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none disabled:opacity-50"
            >
              {fpsOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </AutoSubmitSelect>
          </label>
        </div>

        {hasSelection && !hasCuratedData && (
          <p className="text-xs text-slate-500">
            No profiles curated yet for this game/computer, showing every
            possible target. Pick one and add the first profile below.
          </p>
        )}

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-4 text-lg font-medium text-slate-950 active:bg-slate-300"
        >
          Get settings
        </button>
      </form>

      {hasSelection && profile && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">
              {profile.game.name} on {profile.computer.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                {profile.source === "CURATED" ? "Curated" : "AI-generated"}
              </span>
              <form action={toggleFavorite}>
                <input type="hidden" name="id" value={profile.id} />
                <input type="hidden" name="gameId" value={profile.gameId} />
                <input type="hidden" name="computerId" value={profile.computerId} />
                <input type="hidden" name="resolution" value={profile.targetResolution} />
                <input type="hidden" name="fps" value={profile.targetFps} />
                <button
                  type="submit"
                  aria-label={profile.favorite ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={profile.favorite}
                  className="text-xl leading-none active:scale-90"
                >
                  {profile.favorite ? "❤️" : "🤍"}
                </button>
              </form>
            </div>
          </div>
          <p className="mb-3 text-sm text-slate-400">
            Target: {profile.targetResolution} @ {profile.targetFps} fps
          </p>
          <div className="flex flex-col gap-4">
            {SETTINGS_SECTIONS.map((section) => {
              const values = (profile.settings as StructuredSettings)[section.key];
              if (!values || Object.keys(values).length === 0) return null;
              return (
                <div key={section.key}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {section.label}
                  </p>
                  <dl className="flex flex-col gap-1">
                    {Object.entries(values).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between border-b border-slate-800 py-1 text-sm"
                      >
                        <dt className="text-slate-400">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
          {profile.notes && (
            <p className="mt-3 text-sm text-slate-400">{profile.notes}</p>
          )}
          <Link
            href={`/recommend/new?gameId=${profile.gameId}&computerId=${profile.computerId}&resolution=${profile.targetResolution}&fps=${profile.targetFps}`}
            className="mt-4 inline-block text-sm text-slate-300 underline"
          >
            Edit this profile
          </Link>
        </div>
      )}

      {hasSelection && !profile && (
        <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
          <p className="mb-3">
            No settings have been curated yet for this game, computer, and
            target.
          </p>
          <Link
            href={`/recommend/new?gameId=${params.gameId}&computerId=${params.computerId}&resolution=${targetResolution}&fps=${targetFps}`}
            className="inline-block rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-950"
          >
            Add settings for this pair
          </Link>
        </div>
      )}
    </div>
  );
}
