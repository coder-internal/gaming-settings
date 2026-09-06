"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Flips the favorite flag on a single curated settings profile, then
 * redirects back to wherever the toggle was triggered from (either an
 * explicit `returnTo` field, or the (game, computer, target) view on
 * /recommend) so the heart icon reflects the new state immediately.
 */
export async function toggleFavorite(formData: FormData) {
  const id = String(formData.get("id"));
  const returnTo = formData.get("returnTo");

  const profile = await prisma.settingsProfile.findUnique({ where: { id } });
  if (!profile) {
    throw new Error("Settings profile not found.");
  }

  await prisma.settingsProfile.update({
    where: { id },
    data: { favorite: !profile.favorite },
  });

  if (typeof returnTo === "string" && returnTo) {
    redirect(safeRedirectPath(returnTo));
    return;
  }

  const gameId = String(formData.get("gameId"));
  const computerId = String(formData.get("computerId"));
  const resolution = String(formData.get("resolution"));
  const fps = String(formData.get("fps"));
  redirect(`/recommend?gameId=${gameId}&computerId=${computerId}&resolution=${resolution}&fps=${fps}`);
}
