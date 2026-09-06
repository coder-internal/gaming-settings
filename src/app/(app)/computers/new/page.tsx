import { prisma } from "@/lib/prisma";
import { saveComputer } from "../actions";

export default async function NewComputerPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const existing = id ? await prisma.computer.findUnique({ where: { id } }) : null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{existing ? "Edit computer" : "Add computer"}</h2>
      <form action={saveComputer} className="flex flex-col gap-4">
        {existing && <input type="hidden" name="id" value={existing.id} />}
        <Field label="Name" name="name" placeholder="Living room PC" defaultValue={existing?.name} required />
        <Field label="GPU" name="gpu" placeholder="NVIDIA RTX 4090" defaultValue={existing?.gpu} required />
        <Field label="CPU" name="cpu" placeholder="AMD Ryzen 7 7800X3D" defaultValue={existing?.cpu} required />
        <Field
          label="RAM (GB)"
          name="ramGb"
          type="number"
          inputMode="numeric"
          placeholder="32"
          defaultValue={existing?.ramGb?.toString()}
          required
        />
        <Field label="OS" name="os" placeholder="Windows 11" defaultValue={existing?.os} required />
        <Field
          label="Storage notes (optional)"
          name="storageNotes"
          placeholder="2TB NVMe SSD"
          defaultValue={existing?.storageNotes ?? undefined}
        />
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

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  inputMode,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric";
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-slate-400">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
      />
    </label>
  );
}
