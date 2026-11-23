import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getSettings = cache(async () => {
  const s = await db.siteSettings.findUnique({ where: { id: 1 } });
  return s ?? (await db.siteSettings.create({ data: { id: 1 } }));
});

export type OriginClassDefinitions = Record<string, string>;

export function originClassDefinition(defs: unknown, cls: string | null | undefined): string | null {
  if (!cls || !defs || typeof defs !== "object") return null;
  const v = (defs as Record<string, unknown>)[cls];
  return typeof v === "string" && v.trim() ? v : null;
}
