"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { LOCALE_COOKIE } from "@/i18n/shared";
import { isProd } from "@/lib/env";

export async function setLocale(formData: FormData): Promise<void> {
  const value = formData.get("locale") === "bn" ? "bn" : "en";
  (await cookies()).set(LOCALE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: isProd });
  const user = await getCurrentUser();
  if (user) {
    await db.customerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, preferredLanguage: value === "bn" ? "BN" : "EN" },
      update: { preferredLanguage: value === "bn" ? "BN" : "EN" },
    });
  }
  refresh();
}
