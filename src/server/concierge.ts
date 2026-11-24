import "server-only";
import { db } from "@/lib/db";
import { makeReference } from "@/lib/crypto";
import type { ConciergeTopic } from "@/generated/prisma/client";

/**
 * Concierge request handling. Today every request goes to the human staff queue.
 * A future AI-assisted handler can implement the same interface (e.g. draft a suggested reply or a
 * suggested market for staff to approve) without changing the storefront or admin screens.
 */
export interface ConciergeHandler {
  name: string;
  onNewRequest(requestId: string): Promise<void>;
}

class HumanQueueHandler implements ConciergeHandler {
  name = "human";
  async onNewRequest(): Promise<void> {
    // Staff see new requests in Admin → Concierge. Notification channels (SMS/email) plug in here.
  }
}

const handler: ConciergeHandler = new HumanQueueHandler();

export async function createConciergeRequest(input: {
  userId: string | null; name: string; phone: string; email?: string | null; topic: ConciergeTopic; message: string; orderRef?: string | null; productSlug?: string | null;
}) {
  const req = await db.conciergeRequest.create({
    data: {
      reference: makeReference("CNG"),
      userId: input.userId, name: input.name, phone: input.phone, email: input.email ?? null,
      topic: input.topic, message: input.message, orderRef: input.orderRef ?? null, productSlug: input.productSlug ?? null,
      handler: handler.name,
      messages: { create: { authorId: input.userId, fromStaff: false, body: input.message } },
    },
  });
  await handler.onNewRequest(req.id);
  return req;
}
