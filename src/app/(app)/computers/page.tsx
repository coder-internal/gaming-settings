import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteComputer } from "./actions";

// Reads from Postgres on every request; must not be statically prerendered
// at build time, when no database is reachable.
export const dynamic = "force-dynamic";

export default async function ComputersPage() {
  const computers = await prisma.computer.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Computers</h2>
        <Link
          href="/computers/new"
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 active:bg-slate-300"
        >
          + Add
        </Link>
      </div>

      {computers.length === 0 && (
        <p className="text-sm text-slate-400">
          No computers yet. Add the machine(s) you play on.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {computers.map((computer) => (
          <li
            key={computer.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{computer.name}</p>
                <p className="text-sm text-slate-400">{computer.gpu}</p>
                <p className="text-sm text-slate-400">{computer.cpu}</p>
                <p className="text-sm text-slate-400">
                  {computer.ramGb} GB RAM &middot; {computer.os}
                </p>
                {computer.storageNotes && (
                  <p className="mt-1 text-xs text-slate-500">{computer.storageNotes}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Link
                  href={`/computers/new?id=${computer.id}`}
                  className="rounded-lg px-2 py-1 text-xs text-slate-300 active:bg-slate-800"
                >
                  Edit
                </Link>
                <form action={deleteComputer}>
                  <input type="hidden" name="id" value={computer.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-2 py-1 text-xs text-red-400 active:bg-slate-800"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
