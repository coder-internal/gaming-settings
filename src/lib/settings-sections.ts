/**
 * A curated SettingsProfile is stored as three named sections, so the UI
 * (and future AI-generated recommendations) can distinguish where a given
 * tweak lives: Windows/SteamOS-level settings, GPU vendor software
 * (NVIDIA App / Intel Arc Software), and in-game graphics options.
 */
export const SETTINGS_SECTIONS = [
  { key: "system", label: "System / OS" },
  { key: "gpuSoftware", label: "GPU app (NVIDIA App / Intel Arc Software)" },
  { key: "inGame", label: "In-game" },
] as const;

/**
 * The fixed universe of resolution/FPS values selectable when creating a
 * profile (src/app/(app)/recommend/new). The Recommend page filters these
 * down further to whichever combinations actually have a curated profile
 * for the selected game+computer.
 */
export const RESOLUTION_OPTIONS = [
  { value: "3840x2160", label: "4K (3840x2160)" },
  { value: "2560x1440", label: "1440p" },
  { value: "1920x1080", label: "1080p" },
  { value: "1280x800", label: "Steam Deck (1280x800)" },
] as const;

export const FPS_OPTIONS = [240, 120, 60, 40, 30] as const;

export type SettingsSectionKey = (typeof SETTINGS_SECTIONS)[number]["key"];

export type StructuredSettings = Partial<Record<SettingsSectionKey, Record<string, string>>>;

/**
 * Parses a textarea of "Key: Value" lines into a flat object.
 * e.g. "Texture Quality: High\nRay Tracing: Off" ->
 * { "Texture Quality": "High", "Ray Tracing": "Off" }
 */
export function parseSettingsText(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/** Inverse of parseSettingsText, for pre-filling the edit form. */
export function formatSettingsText(section?: Record<string, string>): string {
  if (!section) return "";
  return Object.entries(section)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}
