import "server-only";
import { db, type Tx } from "@/lib/db";
import { getSettings } from "./settings";

const TZ = "Asia/Dhaka";

/** Today's calendar date in Dhaka as a UTC-midnight Date (matches @db.Date columns). */
export function dhakaToday(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${parts}T00:00:00.000Z`);
}

export function dhakaHour(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(now));
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 864e5);
}

/** Earliest and latest bookable dates given the order cut-off hour and booking window. */
export async function bookingWindow(now = new Date()) {
  const s = await getSettings();
  const today = dhakaToday(now);
  const first = addDays(today, dhakaHour(now) >= s.orderCutoffHour ? 2 : 1);
  const last = addDays(today, s.bookingWindowDays);
  return { first, last };
}

export async function listZones() {
  return db.deliveryZone.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export async function findZoneFor(district: string, area: string, tx?: Tx) {
  const zones = await (tx ?? db).deliveryZone.findMany({ where: { active: true } });
  const d = district.trim().toLowerCase(), a = area.trim().toLowerCase();
  return zones.find((z) => z.district.toLowerCase() === d && z.areas.some((x) => x.toLowerCase() === a)) ?? null;
}

export type SlotView = { id: string; date: string; startTime: string; endTime: string; remaining: number };

export async function availableSlots(zoneId: string, now = new Date()): Promise<SlotView[]> {
  const { first, last } = await bookingWindow(now);
  const slots = await db.deliverySlot.findMany({
    where: { zoneId, active: true, date: { gte: first, lte: last } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return slots.map((s) => ({ id: s.id, date: s.date.toISOString().slice(0, 10), startTime: s.startTime, endTime: s.endTime, remaining: Math.max(0, s.capacity - s.booked) }));
}

export function slotLabel(s: { startTime: string; endTime: string }): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    return m ? `${hh}:${String(m).padStart(2, "0")} ${ampm}` : `${hh} ${ampm}`;
  };
  return `${fmt(s.startTime)} – ${fmt(s.endTime)}`;
}
