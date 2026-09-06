import type { StructuredSettings } from "@/lib/settings-sections";

export type ProfileInput = {
  gameId: string;
  computerId: string;
  targetResolution: string;
  targetFps: number;
  settings: StructuredSettings;
  notes: string | null;
};

const ALLOWED_RESOLUTIONS = ["3840x2160", "2560x1440", "1920x1080", "1280x800"];
const ALLOWED_FPS = [240, 120, 60, 40, 30];
const SECTION_KEYS = ["system", "gpuSoftware", "inGame"] as const;

/**
 * Validates and normalizes a single settings-profile payload shared by the
 * single-profile and bulk API routes. Returns either { data } or { error }.
 */
export function validateProfileInput(
  body: unknown
): { data: ProfileInput; error?: undefined } | { data?: undefined; error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  const gameId = String(b.gameId ?? "").trim();
  const computerId = String(b.computerId ?? "").trim();
  const targetResolution = String(b.targetResolution ?? "").trim();
  const targetFps = Number(b.targetFps);
  const notes = b.notes ? String(b.notes).trim() : null;

  if (!gameId) return { error: "gameId is required." };
  if (!computerId) return { error: "computerId is required." };
  if (!ALLOWED_RESOLUTIONS.includes(targetResolution)) {
    return { error: `targetResolution must be one of ${ALLOWED_RESOLUTIONS.join(", ")}.` };
  }
  if (!ALLOWED_FPS.includes(targetFps)) {
    return { error: `targetFps must be one of ${ALLOWED_FPS.join(", ")}.` };
  }

  const rawSettings = (b.settings ?? {}) as Record<string, unknown>;
  const settings: StructuredSettings = {};
  for (const key of SECTION_KEYS) {
    const section = rawSettings[key];
    if (section == null) continue;
    if (typeof section !== "object" || Array.isArray(section)) {
      return { error: `settings.${key} must be an object of string key/value pairs.` };
    }
    const entries = Object.entries(section as Record<string, unknown>);
    const normalized: Record<string, string> = {};
    for (const [k, v] of entries) normalized[k] = String(v);
    settings[key] = normalized;
  }

  const hasAnySetting = Object.values(settings).some(
    (section) => section && Object.keys(section).length > 0
  );
  if (!hasAnySetting) {
    return { error: "settings must include at least one key/value pair in one section." };
  }

  return { data: { gameId, computerId, targetResolution, targetFps, settings, notes } };
}
