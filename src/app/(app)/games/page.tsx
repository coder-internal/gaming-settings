import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteGame, syncSteamLibrary, syncXboxLibrary } from "./actions";

// Reads from Postgres on every request; must not be statically prerendered
// at build time, when no database is reachable.
export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<string, string> = {
  STEAM: "Steam",
  XBOX: "Xbox / Game Pass",
  OTHER: "Other",
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ synced?: string; xboxSynced?: string; xboxSkipped?: string }>;
}) {
  const { synced, xboxSynced, xboxSkipped } = await searchParams;
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Games</h2>
        <Link
          href="/games/new"
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 active:bg-slate-300"
        >
          + Add
        </Link>
      </div>

      {synced && (
        <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
          Synced {synced} games from Steam.
        </p>
      )}
      {xboxSynced && (
        <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
          Synced {xboxSynced} titles from Xbox
          {xboxSkipped && Number(xboxSkipped) > 0
            ? ` (skipped ${xboxSkipped} already owned on Steam)`
            : ""}
          . Game Pass titles you&apos;ve never launched won&apos;t show up here; add
          those manually.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <form action={syncSteamLibrary}>
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 active:bg-slate-900"
          >
            Sync Steam library
          </button>
        </form>
        <form action={syncXboxLibrary}>
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 active:bg-slate-900"
          >
            Sync Xbox library
          </button>
        </form>
      </div>

      {games.length === 0 && (
        <p className="text-sm text-slate-400">
          No games yet. Add games manually, or sync your Steam/Xbox library above.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {games.map((game) => (
          <li
            key={game.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                {game.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={game.coverImageUrl}
                    alt=""
                    className="h-12 w-24 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{game.name}</p>
                  <p className="text-sm text-slate-400">{PLATFORM_LABEL[game.platform]}</p>
                  {game.notes && (
                    <p className="mt-1 text-xs text-slate-500">{game.notes}</p>
                  )}
                </div>
              </div>
              <form action={deleteGame}>
                <input type="hidden" name="id" value={game.id} />
                <button
                  type="submit"
                  className="rounded-lg px-2 py-1 text-xs text-red-400 active:bg-slate-800"
                >
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
