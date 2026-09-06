import type { Computer, Game } from "@prisma/client";

export type RecommendedSettings = Record<string, string>;

export interface RecommendationInput {
  game: Game;
  computer: Computer;
  targetResolution: string;
  targetFps: number;
}

export interface RecommendationResult {
  settings: RecommendedSettings;
  notes?: string;
  source: "CURATED" | "AI_GENERATED";
}

export interface SettingsRecommender {
  recommend(input: RecommendationInput): Promise<RecommendationResult>;
}

/**
 * Phase 1 stub: no live model is wired up yet. Settings profiles are curated
 * by hand (see the "Add settings" form / prisma/seed.ts) and read straight
 * from the database, so this recommender is only reached when nothing has
 * been curated for a game/computer/target combination yet.
 *
 * Phase 2: replace this with a real call to an LLM provider (OpenAI or
 * Anthropic) using `input`, and persist the result as a SettingsProfile with
 * source = "AI_GENERATED". The call site (src/app/(app)/recommend/actions.ts)
 * does not need to change.
 */
class StubRecommender implements SettingsRecommender {
  async recommend(_input: RecommendationInput): Promise<RecommendationResult> {
    throw new Error(
      "No curated settings exist yet for this game/computer/target, and " +
        "AI-generated recommendations are not wired up in phase 1. Add a " +
        "curated profile instead."
    );
  }
}

export const recommender: SettingsRecommender = new StubRecommender();
