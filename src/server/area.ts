import "server-only";
import { cookies } from "next/headers";
import { availableSlots, listZones, type SlotView } from "./delivery";

/** Cookie holding the shopper's chosen delivery area as "zoneId|area". */
export const AREA_COOKIE = "fth_area";

export type ChosenArea = {
  area: string;
  zoneId: string;
  district: string;
  division: string;
  feeMinor: number;
  freeThresholdMinor: number | null;
  next: SlotView | null;
};

/** The remembered delivery area with its fee and the next slot that still has room, or null. */
export async function getChosenArea(): Promise<ChosenArea | null> {
  const raw = (await cookies()).get(AREA_COOKIE)?.value;
  if (!raw) return null;
  const [zoneId, area] = raw.split("|");
  if (!zoneId || !area) return null;
  const zone = (await listZones()).find((z) => z.id === zoneId && z.areas.includes(area));
  if (!zone) return null;
  const next = (await availableSlots(zone.id)).find((s) => s.remaining > 0) ?? null;
  return { area, zoneId: zone.id, district: zone.district, division: zone.division, feeMinor: zone.feeMinor, freeThresholdMinor: zone.freeThresholdMinor, next };
}

/** Areas grouped by zone for the area picker. */
export async function areaOptions() {
  return (await listZones()).map((z) => ({ zoneId: z.id, zone: z.name, areas: [...z.areas].sort() }));
}
