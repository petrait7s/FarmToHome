import "server-only";
import { NextResponse } from "next/server";

/**
 * CSRF defence for JSON route handlers: mutating requests must come from our own origin.
 * (Server Actions get the same check from Next.js automatically.)
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}
