import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleFavorite } from "../recommend/actions";

// Reads from Postgres on every request; must not be statically prerendered
// at build time, when no database is reachable.
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const favorites = await prisma.settingsProfile.findMany({
    where: { favorite: true },
    include: { game: true, computer: true },
    orderBy: [{ game: { name: "asc" } }, { computer: { name: "asc" } }],
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Favorites</h2>

      {favorites.length === 0 && (
        <p className="text-sm text-slate-400">
          No favorites yet. Tap the ♡ on any settings profile in Recommend to
          pin it here.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {favorites.map((profile) => (
          <li
            key={profile.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/recommend?gameId=${profile.gameId}&computerId=${profile.computerId}&resolution=${profile.targetResolution}&fps=${profile.targetFps}`}
                className="flex-1"
              >
                <p className="font-medium">
                  {profile.game.name} on {profile.computer.name}
                </p>
                <p className="text-sm text-slate-400">
                  Target: {profile.targetResolution} @ {profile.targetFps} fps
                </p>
              </Link>
              <form action={toggleFavorite}>
                <input type="hidden" name="id" value={profile.id} />
                <input type="hidden" name="returnTo" value="/favorites" />
                <button
                  type="submit"
                  aria-label="Remove from favorites"
                  className="text-xl leading-none active:scale-90"
                >
                  ❤️
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
