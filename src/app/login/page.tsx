import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold">Gaming Settings</h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          Enter the passcode to continue
        </p>
        <form action={login} className="flex flex-col gap-4">
          <input type="hidden" name="from" value={from ?? "/"} />
          <input
            type="password"
            name="passcode"
            inputMode="numeric"
            autoFocus
            placeholder="Passcode"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-lg text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          />
          {error === "rate_limit" && (
            <p className="text-center text-sm text-red-400">
              Too many attempts. Wait a minute and try again.
            </p>
          )}
          {error && error !== "rate_limit" && (
            <p className="text-center text-sm text-red-400">Incorrect passcode.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-100 px-4 py-4 text-lg font-medium text-slate-950 active:bg-slate-300"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
