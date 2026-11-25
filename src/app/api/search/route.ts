import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { suggest } from "@/server/search";
import { jsonError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = clientIp(await headers()) ?? "unknown";
  if (!(await rateLimit(`search:${ip}`, 120, 60))) return jsonError(429, "too_many");
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ ok: true, ...(await suggest(q)) }, { headers: { "Cache-Control": "no-store" } });
}
