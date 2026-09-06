"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, isValidPasscode } from "@/lib/auth";

export async function login(formData: FormData) {
  const passcode = formData.get("passcode");
  const from = formData.get("from");
  const redirectTo = typeof from === "string" && from.startsWith("/") ? from : "/";

  if (typeof passcode !== "string" || !isValidPasscode(passcode)) {
    redirect(`/login?error=1&from=${encodeURIComponent(redirectTo)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, passcode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(redirectTo);
}
