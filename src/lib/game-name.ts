/**
 * Normalizes a game title for cross-platform duplicate detection (e.g. the
 * same game owned on both Steam and Xbox/Game Pass). Strips trademark
 * symbols and punctuation, and lowercases, so "Halo: The Master Chief
 * Collection" and "Halo: The Master Chief Collection™" match.
 */
export function normalizeGameName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
