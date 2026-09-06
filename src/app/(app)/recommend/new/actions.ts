"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseSettingsText, type StructuredSettings } from "@/lib/settings-sections";

export async function saveSettingsProfile(formData: FormData) {
  const gameId = String(formData.get("gameId"));
  const computerId = String(formData.get("computerId"));
  const targetResolution = String(formData.get("targetResolution"));
  const targetFps = Number(formData.get("targetFps"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!gameId || !computerId || !targetResolution || !targetFps) {
    throw new Error("Game, computer, resolution, and FPS are required.");
  }

  const settings: StructuredSettings = {
    system: parseSettingsText(String(formData.get("systemText") ?? "")),
    gpuSoftware: parseSettingsText(String(formData.get("gpuSoftwareText") ?? "")),
    inGame: parseSettingsText(String(formData.get("inGameText") ?? "")),
  };

  const hasAnySetting = Object.values(settings).some(
    (section) => section && Object.keys(section).length > 0
  );
  if (!hasAnySetting) {
    throw new Error(
      "Add at least one setting in one of the sections, one per line as \"Key: Value\"."
    );
  }

  await prisma.settingsProfile.upsert({
    where: {
      gameId_computerId_targetResolution_targetFps: {
        gameId,
        computerId,
        targetResolution,
        targetFps,
      },
    },
    update: { settings, notes: notes || null, source: "CURATED" },
    create: {
      gameId,
      computerId,
      targetResolution,
      targetFps,
      settings,
      notes: notes || null,
      source: "CURATED",
    },
  });

  redirect(
    `/recommend?gameId=${gameId}&computerId=${computerId}&resolution=${targetResolution}&fps=${targetFps}`
  );
}
