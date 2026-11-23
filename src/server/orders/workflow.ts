import type { OrderStatus } from "@/generated/prisma/client";

/** Fulfilment stages in order. Sourcing stages apply only when an order contains sourced-to-order items. */
export const STAGES: OrderStatus[] = [
  "PLACED", "CONFIRMED", "PROCUREMENT", "QUALITY_CHECK", "PROCESSING", "PACKAGING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED",
];
const SOURCING: OrderStatus[] = ["PROCUREMENT", "QUALITY_CHECK", "PROCESSING"];

export function applicableStages(needsSourcing: boolean): OrderStatus[] {
  return needsSourcing ? STAGES : STAGES.filter((s) => !SOURCING.includes(s));
}

/** Statuses staff may move an order to next (forward to any later applicable stage, or cancel before dispatch). */
export function nextStatuses(current: OrderStatus, needsSourcing: boolean): OrderStatus[] {
  if (current === "DELIVERED" || current === "CANCELLED") return [];
  const stages = applicableStages(needsSourcing);
  const idx = stages.indexOf(current);
  const forward = idx >= 0 ? stages.slice(idx + 1) : [];
  const canCancel = !["OUT_FOR_DELIVERY"].includes(current);
  return canCancel ? [...forward, "CANCELLED"] : forward;
}

export function canTransition(from: OrderStatus, to: OrderStatus, needsSourcing: boolean): boolean {
  return nextStatuses(from, needsSourcing).includes(to);
}

export function customerCanCancel(status: OrderStatus): boolean {
  return status === "PLACED";
}

/** Stock leaves the warehouse when the order goes out for delivery (or is marked delivered directly). */
export function fulfilsStock(to: OrderStatus): boolean {
  return to === "OUT_FOR_DELIVERY" || to === "DELIVERED";
}
