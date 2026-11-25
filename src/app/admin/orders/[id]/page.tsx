import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { applicableStages, nextStatuses } from "@/server/orders/workflow";
import { adminAllocateBatch, adminChangeStatus, adminPaymentStatus, adminSaveDelivery } from "@/app/actions/admin/orders";
import { Badge, Card, F, Flash, FormGrid, Grid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Order" };

export default async function AdminOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { allocations: { include: { batch: true } }, variant: { select: { productId: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
      payments: { orderBy: { createdAt: "asc" }, include: { events: { orderBy: { createdAt: "asc" } } } },
      delivery: true, zone: true, user: { select: { id: true, name: true } },
    },
  });
  if (!order) notFound();
  const next = nextStatuses(order.status, order.needsSourcing);
  const sourcedItems = order.items.filter((i) => i.fulfillmentMode === "SOURCED_TO_ORDER");
  const batchOptions = sourcedItems.length
    ? await db.batch.findMany({ where: { productId: { in: sourcedItems.map((i) => i.variant.productId) }, status: { in: ["APPROVED", "PACKED", "ACTIVE"] } }, orderBy: { collectedAt: "desc" } })
    : [];
  const slots = await db.deliverySlot.findMany({ where: { zoneId: order.zoneId, date: { gte: new Date(new Date().toISOString().slice(0, 10)) }, active: true }, orderBy: [{ date: "asc" }, { startTime: "asc" }], take: 40 });

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={order.reference}
        subtitle={<>{order.contactName} · {order.contactPhone}{order.user ? <> · <Link className="link" href={`/admin/customers/${order.user.id}`}>customer profile</Link></> : " · guest"} · placed {order.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</>}
        actions={<Badge tone={order.status === "CANCELLED" ? "line" : "red"}>{order.status.replaceAll("_", " ")}</Badge>}
      />
      <Flash sp={sp} />
      <Grid cols={2}>
        <Card title="Fulfilment">
          <p className="muted-note" style={{ marginBottom: 10 }}>Stages for this order: {applicableStages(order.needsSourcing).map((s) => s.replaceAll("_", " ").toLowerCase()).join(" → ")}</p>
          {next.length ? (
            <form action={adminChangeStatus} className="stack" style={{ ["--stack" as string]: "10px" }}>
              <input type="hidden" name="orderId" value={order.id} />
              <F label="Move to" name="status" required options={next.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))} />
              <F label="Note (shown in history)" name="note" />
              <button className="btn btn-primary btn-sm">Update status</button>
            </form>
          ) : <p>This order is {order.status.toLowerCase()}; no further status changes.</p>}
          <ol style={{ listStyle: "none", marginTop: 16, display: "grid", gap: 6, fontSize: 13.5 }}>
            {order.statusHistory.map((h) => <li key={h.id}><b>{h.status.replaceAll("_", " ")}</b> · {h.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} · {h.actor?.name ?? "system"}{h.note ? ` — ${h.note}` : ""}</li>)}
          </ol>
        </Card>
        <Card title="Delivery">
          <p>{order.line1}, {order.area}, {order.district}, {order.division}</p>
          {order.landmark ? <p className="muted-note">Landmark: {order.landmark}</p> : null}
          {order.instructions ? <p className="muted-note">Instructions: {order.instructions}</p> : null}
          {order.customerNote ? <p className="muted-note">Customer note: {order.customerNote}</p> : null}
          <p style={{ margin: "8px 0 14px" }}><b>{order.deliveryDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</b> · {order.slotLabel} · {order.zone.name}</p>
          <form action={adminSaveDelivery}>
            <input type="hidden" name="orderId" value={order.id} />
            <FormGrid>
              <F label="Rider name" name="riderName" defaultValue={order.delivery?.riderName} />
              <F label="Rider phone" name="riderPhone" defaultValue={order.delivery?.riderPhone} />
              <F label="Reschedule slot" name="slotId" defaultValue={order.slotId} options={slots.map((s) => ({ value: s.id, label: `${s.date.toISOString().slice(0, 10)} ${s.startTime}–${s.endTime} (${s.capacity - s.booked} left)` }))} wide />
              <F label="Delivery notes" name="notes" defaultValue={order.delivery?.notes} wide />
              <F label="Internal staff note" name="staffNote" type="textarea" defaultValue={order.staffNote} wide />
            </FormGrid>
            <button className="btn btn-sm" style={{ marginTop: 12 }}>Save delivery</button>
          </form>
        </Card>
      </Grid>

      <Card title="Items & batch allocation">
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Line</th><th>Batches</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.productName} <span className="muted-note">{i.variantLabel} · {i.sku}</span>{i.fulfillmentMode === "SOURCED_TO_ORDER" ? <><br /><Badge>sourced to order</Badge></> : null}<br /><span className="muted-note">If unavailable: {i.onUnavailable === "REMOVE" ? "remove, do not charge" : "call customer to agree a replacement"}</span></td>
                <td>{i.quantity}</td>
                <td className="tnum">{formatMoney(i.unitPriceMinor)}</td>
                <td className="tnum">{formatMoney(i.lineTotalMinor)}{i.discountMinor ? <><br /><span className="muted-note">− {formatMoney(i.discountMinor)}</span></> : null}</td>
                <td>
                  {i.allocations.map((a) => <div key={a.id}><Link className="link mono" href={`/admin/batches/${a.batchId}`}>{a.batch.batchNumber}</Link> × {a.quantity}{a.fulfilled ? " · dispatched" : " · reserved"}</div>)}
                  {i.fulfillmentMode === "SOURCED_TO_ORDER" && !i.allocations.some((a) => a.fulfilled) && order.status !== "CANCELLED" ? (
                    <form action={adminAllocateBatch} style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="orderItemId" value={i.id} />
                      <select name="batchId" className="select" style={{ minHeight: 36, padding: "4px 10px" }} required>
                        {batchOptions.filter((b) => b.productId === i.variant.productId).map((b) => <option key={b.id} value={b.id}>{b.batchNumber}</option>)}
                      </select>
                      <button className="btn btn-sm">Allocate</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p style={{ textAlign: "right", marginTop: 12 }}>Subtotal {formatMoney(order.subtotalMinor)} · Discount {formatMoney(order.discountMinor)}{order.promoCode ? ` (${order.promoCode})` : ""} · Delivery {formatMoney(order.deliveryFeeMinor)} · <b>Total {formatMoney(order.totalMinor)}</b></p>
      </Card>

      <Card title="Payments">
        {order.payments.map((p) => (
          <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
            <p><b>{p.method.replaceAll("_", " ")}</b> · {p.status} · {formatMoney(p.amountMinor)} {p.isSimulated ? <Badge>simulated</Badge> : null} {p.transactionRef ? <span className="mono muted-note">{p.transactionRef}</span> : null}</p>
            <p className="muted-note">{p.events.map((e) => `${e.status} (${e.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })})${e.note ? `: ${e.note}` : ""}`).join(" → ")}</p>
            <form action={adminPaymentStatus} style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="paymentId" value={p.id} />
              <select name="status" className="select" style={{ minHeight: 36, padding: "4px 10px", width: "auto" }}>
                {["PAID", "REFUND_PENDING", "REFUNDED", "FAILED", "CANCELLED"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <input name="note" className="input" placeholder="Note / reference" style={{ minHeight: 36, padding: "4px 10px", width: 220 }} />
              <button className="btn btn-sm">Update payment</button>
            </form>
          </div>
        ))}
      </Card>
    </>
  );
}
