import "server-only";
import { headers } from "next/headers";
import { db, type Tx } from "@/lib/db";
import { clientIp } from "./auth/session";
import type { Prisma } from "@/generated/prisma/client";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  data?: Prisma.InputJsonValue,
  tx?: Tx,
): Promise<void> {
  let ip: string | null = null;
  try {
    ip = clientIp(await headers());
  } catch {
    ip = null; // called outside a request (seed, tests)
  }
  await (tx ?? db).auditLog.create({ data: { actorId, action, entity, entityId: entityId ?? null, data, ip } });
}
