import { NextResponse } from "next/server";
import { z } from "zod";
import { addLinesToCart, clearCart, getCurrentCart, getOrCreateCartId, loadCart, setCartMode, setCartQuantity, setUnavailablePref, swapVariant } from "@/server/cart";
import { jsonError, sameOrigin } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { cuid } from "@/lib/validation";
import { headers } from "next/headers";
import { clientIp } from "@/server/auth/session";

const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("set"), variantId: cuid, quantity: z.number().int().min(0).max(1000) }),
  z.object({ op: z.literal("swap"), fromVariantId: cuid, toVariantId: cuid }),
  z.object({ op: z.literal("clear") }),
  z.object({ op: z.literal("mode"), mode: z.enum(["WEEKLY", "MONTHLY", "CUSTOM"]) }),
  z.object({ op: z.literal("pref"), variantId: cuid.nullable(), pref: z.enum(["CALL", "REMOVE"]) }),
  z.object({ op: z.literal("bulk"), mode: z.enum(["merge", "replace"]), lines: z.array(z.object({ variantId: cuid, quantity: z.number().int().min(1).max(30) })).max(100) }),
]);

export const dynamic = "force-dynamic";

export async function GET() {
  const cart = await getCurrentCart();
  return NextResponse.json({ ok: true, cart }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError(403, "forbidden");
  const ip = clientIp(await headers()) ?? "unknown";
  if (!(await rateLimit(`cart:${ip}`, 240, 60))) return jsonError(429, "too_many");

  let parsed;
  try {
    parsed = body.safeParse(await req.json());
  } catch {
    return jsonError(400, "bad_request");
  }
  if (!parsed.success) return jsonError(400, "bad_request");
  const input = parsed.data;

  const cartId = await getOrCreateCartId();
  let err = null;
  switch (input.op) {
    case "set":
      err = await setCartQuantity(cartId, input.variantId, input.quantity);
      break;
    case "swap":
      err = await swapVariant(cartId, input.fromVariantId, input.toVariantId);
      break;
    case "clear":
      await clearCart(cartId);
      break;
    case "mode":
      await setCartMode(cartId, input.mode);
      break;
    case "pref":
      await setUnavailablePref(cartId, input.variantId, input.pref);
      break;
    case "bulk": {
      const result = await addLinesToCart(cartId, input.lines, input.mode);
      const cart = await loadCart(cartId);
      return NextResponse.json({ ok: true, cart, result });
    }
  }
  const cart = await loadCart(cartId);
  if (err) return NextResponse.json({ ok: false, ...err, cart }, { status: 409 });
  return NextResponse.json({ ok: true, cart });
}
