import { toBanglaDigits } from "./money";

/** "10 AM – 12 PM" from "10:00"/"12:00", with Bangla digits for Bangla. */
export function slotTime(s: { startTime: string; endTime: string }, locale: string): string {
  const f = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hh = h % 12 || 12;
    return `${hh}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
  };
  const text = `${f(s.startTime)} – ${f(s.endTime)}`;
  return locale === "bn" ? toBanglaDigits(text) : text;
}

/** "Thu, 27 Nov" for a YYYY-MM-DD slot date. */
export function slotDay(date: string, locale: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
