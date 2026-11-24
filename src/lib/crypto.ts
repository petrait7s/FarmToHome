import "server-only";
import { createHmac, randomBytes, randomInt } from "node:crypto";
import { env } from "./env";

/** Random URL-safe token for sessions, carts, resets and guest order access. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Keyed hash so a leaked database alone cannot be used to forge cookies. */
export function hashToken(token: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}

/** Human-friendly reference, e.g. FTH-261124-4821. */
export function makeReference(prefix: string, date = new Date()): string {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += alphabet[randomInt(alphabet.length)];
  return `${prefix}-${y}${m}${d}-${suffix}`;
}
