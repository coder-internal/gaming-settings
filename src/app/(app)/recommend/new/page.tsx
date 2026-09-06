import { prisma } from "@/lib/prisma";
import { saveSettingsProfile } from "./actions";
import {
  SETTINGS_SECTIONS,
  RESOLUTION_OPTIONS,
  FPS_OPTIONS,
  formatSettingsText,
  type StructuredSettings,
} from "@/lib/settings-sections";
import { SearchableSelect } from "@/components/SearchableSelect";

const SECTION_PLACEHOLDER: Record<string, string> = {
  system: "Power Plan: Balanced\nHardware GPU Scheduling: On\nGame Mode: On\nVRR: On\nHDR: Off",
  gpuSoftware:
    "App: NVIDIA App\nDriver Profile: Optimal Playable Settings + overrides\nDLSS Override: Off\nReflex: On + Boost",
  inGame:
    "Preset: High\nRay Tracing: Off\nUpscaler: DLSS Quality\nFrame Generation: On\nTexture Quality: Ultra",
};

export default async function NewSettingsProfilePage({
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
  const [games, computers, existing] = await Promise.all([
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.computer.findMany({ orderBy: { name: "asc" } }),
    params.gameId && params.computerId && params.resolution && params.fps
      ? prisma.settingsProfile.findUnique({
          where: {
            gameId_computerId_targetResolution_targetFps: {
              gameId: params.gameId,
              computerId: params.computerId,
              targetResolution: params.resolution,
              targetFps: Number(params.fps),
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const existingSettings = (existing?.settings as StructuredSettings | undefined) ?? {};

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">
        {existing ? "Edit settings" : "Add settings"}
      </h2>
      <form action={saveSettingsProfile} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Game</span>
          <SearchableSelect
            name="gameId"
            options={games}
            defaultValue={params.gameId ?? ""}
            placeholder="Select a game"
            searchPlaceholder="Search games..."
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Computer</span>
          <select
            name="computerId"
            defaultValue={params.computerId ?? ""}
            required
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
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-400">Target resolution</span>
            <select
              name="targetResolution"
              defaultValue={params.resolution ?? "3840x2160"}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none"
            >
              {RESOLUTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-400">Target FPS</span>
            <select
              name="targetFps"
              defaultValue={params.fps ?? "120"}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none"
            >
              {FPS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {SETTINGS_SECTIONS.map((section) => (
          <label key={section.key} className="flex flex-col gap-1">
            <span className="text-sm text-slate-400">
              {section.label} (one per line, &quot;Key: Value&quot;)
            </span>
            <textarea
              name={`${section.key}Text`}
              rows={5}
              defaultValue={formatSettingsText(existingSettings[section.key])}
              placeholder={SECTION_PLACEHOLDER[section.key]}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
            />
          </label>
        ))}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Notes (optional)</span>
          <input
            name="notes"
            defaultValue={existing?.notes ?? ""}
            placeholder="e.g. Confidence level, source of the recommendation, in-game benchmark results"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-4 text-lg font-medium text-slate-950 active:bg-slate-300"
        >
          Save
        </button>
      </form>
    </div>
  );
}
