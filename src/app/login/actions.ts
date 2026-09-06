"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, isValidPasscode } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { isRateLimited } from "@/lib/rate-limit";

export async function login(formData: FormData) {
  const passcode = formData.get("passcode");
  const from = formData.get("from");
  const redirectTo = safeRedirectPath(from);

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`login:${ip}`)) {
    redirect(`/login?error=rate_limit&from=${encodeURIComponent(redirectTo)}`);
  }

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
