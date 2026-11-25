"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { listZones } from "@/server/delivery";
import { AREA_COOKIE } from "@/server/area";
import { isProd } from "@/lib/env";

/** Remember the shopper's delivery area so the header can show the next slot and fee. */
export async function setDeliveryArea(formData: FormData): Promise<void> {
  const value = String(formData.get("area") ?? "");
  const [zoneId, area] = value.split("|");
  const jar = await cookies();
  const zone = zoneId && area ? (await listZones()).find((z) => z.id === zoneId && z.areas.includes(area)) : null;
  if (zone) jar.set(AREA_COOKIE, `${zone.id}|${area}`, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: isProd, httpOnly: true });
  else jar.delete(AREA_COOKIE);
  refresh();
}
