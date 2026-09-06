"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeGameName } from "@/lib/game-name";

export async function createGame(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const platform = String(formData.get("platform") ?? "OTHER");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  await prisma.game.create({
    data: {
      name,
      platform: platform as "STEAM" | "XBOX" | "OTHER",
      notes: notes || null,
    },
  });

  revalidatePath("/games");
  redirect("/games");
}

export async function deleteGame(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.game.delete({ where: { id } });
  revalidatePath("/games");
}

/**
 * Calls the Steam Web API (IPlayerService/GetOwnedGames) using the
 * STEAM_API_KEY + STEAM_ID env vars, and upserts each owned game by
 * steamAppId. Returns the number of games synced.
 */
export async function syncSteamLibrary() {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    throw new Error(
      "STEAM_API_KEY and STEAM_ID must be set as environment variables to sync your Steam library."
    );
  }

  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");
  url.searchParams.set("format", "json");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Steam API request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    response?: { games?: { appid: number; name: string }[] };
  };
  const games = data.response?.games ?? [];

  if (games.length === 0) {
    throw new Error(
      "Steam API returned no games. Check that STEAM_ID is correct and the API key belongs to that account."
    );
  }

  for (const game of games) {
    await prisma.game.upsert({
      where: { steamAppId: game.appid },
      update: { name: game.name },
      create: {
        name: game.name,
        platform: "STEAM",
        steamAppId: game.appid,
        coverImageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
      },
    });
  }

  revalidatePath("/games");
  redirect(`/games?synced=${games.length}`);
}

/**
 * Calls the OpenXBL (xbl.io) title history endpoint using XBL_API_KEY, and
 * upserts each title by xboxTitleId. OpenXBL is an unofficial, third-party
 * Xbox Live API; Microsoft doesn't offer an equivalent self-serve API for
 * personal use. Title history reflects games that have been launched at
 * least once, so Game Pass titles never played won't show up here and need
 * to be added manually.
 *
 * Steam is treated as the source of truth: any title that already exists
 * as a Steam game (matched by normalized name) is skipped rather than
 * creating a duplicate Xbox row, and any Xbox duplicates created by a
 * previous sync are cleaned up automatically.
 */
export async function syncXboxLibrary() {
  const apiKey = process.env.XBL_API_KEY;

  if (!apiKey) {
    throw new Error("XBL_API_KEY must be set as an environment variable to sync your Xbox library.");
  }

  const response = await fetch("https://xbl.io/api/v2/player/titleHistory", {
    headers: {
      "X-Authorization": apiKey,
      Accept: "application/json",
      "Accept-Language": "en-US",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Xbox API request failed: ${response.status} ${response.statusText}`);
  }

  type TitleEntry = { titleId: string; name: string; displayImage?: string; type?: string };
  const data = (await response.json()) as {
    titles?: TitleEntry[];
    content?: { titles?: TitleEntry[] };
  };
  // OpenXBL wraps a successful payload as { code, content: { titles: [...] } }.
  const titles = (data.titles ?? data.content?.titles ?? []).filter(
    (title) => !title.type || title.type === "Game"
  );

  if (titles.length === 0) {
    throw new Error(
      "Xbox API returned no titles. Check that XBL_API_KEY is valid and hasn't expired."
    );
  }

  const steamGames = await prisma.game.findMany({ where: { platform: "STEAM" } });
  const steamNames = new Set(steamGames.map((game) => normalizeGameName(game.name)));

  // Clean up any Xbox duplicates a previous sync created before this
  // dedupe logic existed (or before the matching Steam game was added).
  const existingXboxGames = await prisma.game.findMany({ where: { platform: "XBOX" } });
  const duplicateIds = existingXboxGames
    .filter((game) => steamNames.has(normalizeGameName(game.name)))
    .map((game) => game.id);
  if (duplicateIds.length > 0) {
    await prisma.game.deleteMany({ where: { id: { in: duplicateIds } } });
  }

  let created = 0;
  let skipped = 0;
  for (const title of titles) {
    if (steamNames.has(normalizeGameName(title.name))) {
      skipped += 1;
      continue;
    }

    await prisma.game.upsert({
      where: { xboxTitleId: title.titleId },
      update: { name: title.name },
      create: {
        name: title.name,
        platform: "XBOX",
        xboxTitleId: title.titleId,
        coverImageUrl: title.displayImage || null,
      },
    });
    created += 1;
  }

  revalidatePath("/games");
  redirect(`/games?xboxSynced=${created}&xboxSkipped=${skipped}`);
}
