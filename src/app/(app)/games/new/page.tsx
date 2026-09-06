import { createGame } from "../actions";

export default function NewGamePage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Add game</h2>
      <form action={createGame} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Name</span>
          <input
            name="name"
            placeholder="Cyberpunk 2077"
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Platform</span>
          <select
            name="platform"
            defaultValue="STEAM"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-slate-400 focus:outline-none"
          >
            <option value="STEAM">Steam</option>
            <option value="XBOX">Xbox / Game Pass</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Notes (optional)</span>
          <input
            name="notes"
            placeholder="e.g. Game Pass, uninstalled"
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
