import "server-only";
import type { PaymentMethod, PaymentStatus } from "@/generated/prisma/client";
import { db, type Tx } from "@/lib/db";

/**
 * Payment provider boundary. Real Bangladesh providers (e.g. bKash, Nagad, SSLCommerz) plug in here
 * once credentials and agreements exist. Until then only Cash on Delivery and clearly labelled
 * simulated providers are available. No card or wallet credentials are ever collected by this app.
 */
export interface PaymentProvider {
  method: PaymentMethod;
  provider: string;
  simulated: boolean;
  /** Called after the order is created. Returns a URL the customer must visit to pay, if any. */
  nextStepUrl(paymentId: string, orderRef: string, accessQuery: string): string | null;
}

const providers: Record<PaymentMethod, PaymentProvider> = {
  CASH_ON_DELIVERY: { method: "CASH_ON_DELIVERY", provider: "cod", simulated: false, nextStepUrl: () => null },
  MOBILE_SIMULATED: { method: "MOBILE_SIMULATED", provider: "sandbox-mobile", simulated: true, nextStepUrl: (id, ref, q) => `/pay/${ref}/${id}${q}` },
  ONLINE_SIMULATED: { method: "ONLINE_SIMULATED", provider: "sandbox-online", simulated: true, nextStepUrl: (id, ref, q) => `/pay/${ref}/${id}${q}` },
};

export function getProvider(method: PaymentMethod): PaymentProvider {
  return providers[method];
}

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH_ON_DELIVERY", "MOBILE_SIMULATED", "ONLINE_SIMULATED"];

const transitions: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["AUTHORIZED", "PAID", "FAILED", "CANCELLED"],
  AUTHORIZED: ["PAID", "CANCELLED", "FAILED"],
  FAILED: ["PENDING", "CANCELLED"],
  PAID: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
  CANCELLED: [],
};

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return transitions[from].includes(to);
}

/** Move a payment to a new status, validating the transition and recording an event. */
export async function setPaymentStatus(paymentId: string, to: PaymentStatus, note: string | null, tx?: Tx): Promise<boolean> {
  const client = tx ?? db;
  const p = await client.payment.findUnique({ where: { id: paymentId } });
  if (!p || p.status === to) return false;
  if (!canTransition(p.status, to)) return false;
  await client.payment.update({
    where: { id: paymentId },
    data: {
      status: to,
      transactionRef: to === "PAID" && !p.transactionRef ? `${p.isSimulated ? "SIM" : "TXN"}-${p.id.slice(-10).toUpperCase()}` : undefined,
      failureReason: to === "FAILED" ? note : undefined,
      refundedMinor: to === "REFUNDED" ? p.amountMinor : undefined,
    },
  });
  await client.paymentEvent.create({ data: { paymentId, status: to, note } });
  return true;
}
