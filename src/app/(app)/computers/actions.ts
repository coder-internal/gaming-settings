"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Creates a new computer, or updates an existing one when an `id` field is
 * present in the form (used by both /computers/new and the edit flow for
 * an existing machine, e.g. after a hardware upgrade).
 */
export async function saveComputer(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const cpu = String(formData.get("cpu") ?? "").trim();
  const gpu = String(formData.get("gpu") ?? "").trim();
  const ramGb = Number(formData.get("ramGb") ?? 0);
  const os = String(formData.get("os") ?? "").trim();
  const storageNotes = String(formData.get("storageNotes") ?? "").trim();

  if (!name || !cpu || !gpu || !ramGb || !os) {
    throw new Error("Name, CPU, GPU, RAM, and OS are required.");
  }

  const data = { name, cpu, gpu, ramGb, os, storageNotes: storageNotes || null };

  if (id) {
    await prisma.computer.update({ where: { id }, data });
  } else {
    await prisma.computer.create({ data });
  }

  revalidatePath("/computers");
  redirect("/computers");
}

export async function deleteComputer(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.computer.delete({ where: { id } });
  revalidatePath("/computers");
}
