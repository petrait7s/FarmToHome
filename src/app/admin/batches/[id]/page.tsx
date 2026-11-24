import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { addInspection, addReport, stockMovement, updateBatch } from "@/app/actions/admin/sourcing";
import { requireStaffPage } from "@/server/auth/guards";
import { Badge, Card, F, Flash, FormGrid, Grid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Batch" };

const d = (v: Date | null) => (v ? new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export default async function BatchDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireStaffPage();
  const b = await db.batch.findUnique({
    where: { id },
    include: {
      product: { include: { variants: { orderBy: { position: "asc" } } } }, producer: true, origin: true,
      procurementItem: { include: { procurement: true } },
      inspections: { orderBy: { inspectedAt: "desc" }, include: { inspector: { select: { name: true } } } },
      reports: { orderBy: { createdAt: "desc" } },
      inventory: { include: { variant: true } },
      movements: { orderBy: { createdAt: "desc" }, take: 30, include: { variant: { select: { label: true } }, actor: { select: { name: true } }, order: { select: { reference: true, id: true } } } },
      allocations: { take: 20, include: { orderItem: { include: { order: { select: { reference: true, id: true } } } } } },
    },
  });
  if (!b) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/batches", label: "Batches" }} title={b.batchNumber}
        subtitle={<>{b.product.name} · {b.producer?.name ?? "no producer"} · {b.origin?.district ?? ""}{b.procurementItem ? <> · <Link className="link" href={`/admin/procurement/${b.procurementItem.procurementId}`}>{b.procurementItem.procurement.reference}</Link></> : null}</>}
        actions={<><Badge tone="red">{b.status}</Badge><Link className="btn btn-sm" href={`/trace/${b.batchNumber}`} target="_blank">Public trace page</Link></>} />
      <Flash sp={sp} />
      <Grid cols={2}>
        <Card title="Batch record">
          <form action={updateBatch}>
            <input type="hidden" name="id" value={b.id} />
            <FormGrid>
              <F label="Status" name="status" defaultValue={b.status} required options={["RECEIVED", "INSPECTING", "APPROVED", "REJECTED", "PROCESSING", "PACKED", "ACTIVE", "DEPLETED", "RECALLED"].map((s) => ({ value: s, label: s }))} />
              <F label="Quality grade" name="qualityGrade" defaultValue={b.qualityGrade} />
              <F label="Collected / harvested" name="collectedAt" type="datetime-local" defaultValue={d(b.collectedAt)} />
              <F label="Processed" name="processedAt" type="datetime-local" defaultValue={d(b.processedAt)} />
              <F label="Packed" name="packedAt" type="datetime-local" defaultValue={d(b.packedAt)} />
              <F label="Best before" name="bestBefore" type="datetime-local" defaultValue={d(b.bestBefore)} />
              <F label={`Rejected (${b.quantityUnit ?? "unit"})`} name="rejectedQuantity" type="number" step="0.01" defaultValue={b.rejectedQuantity} required />
              <F label={`Processing loss (${b.quantityUnit ?? "unit"})`} name="processingLoss" type="number" step="0.01" defaultValue={b.processingLoss} required />
              <F label={`Packaging loss (${b.quantityUnit ?? "unit"})`} name="packagingLoss" type="number" step="0.01" defaultValue={b.packagingLoss} required />
              <div className="muted-note" style={{ alignSelf: "center" }}>Received: {b.receivedQuantity ?? "—"} {b.quantityUnit}</div>
              <F label="Source note (public)" name="sourceNote" defaultValue={b.sourceNote} wide />
              <F label="Processing notes (public)" name="processingNotes" type="textarea" rows={2} defaultValue={b.processingNotes} />
              <F label="Packaging notes (public)" name="packagingNotes" type="textarea" rows={2} defaultValue={b.packagingNotes} />
              <F label="Storage notes (public)" name="storageNotes" type="textarea" rows={2} defaultValue={b.storageNotes} wide />
            </FormGrid>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Save batch</button>
          </form>
        </Card>
        <div>
          <Card title="Stock from this batch">
            <div className="table-wrap"><table className="table"><tbody>
              {b.product.variants.map((v) => {
                const inv = b.inventory.find((i) => i.variantId === v.id);
                return <tr key={v.id}><td>{v.label} <span className="muted-note">{v.fulfillmentMode === "SOURCED_TO_ORDER" ? "sourced to order" : ""}</span></td><td className="tnum">{inv?.onHand ?? 0} on hand</td><td className="tnum">{inv?.reserved ?? 0} reserved</td></tr>;
              })}
            </tbody></table></div>
            <form action={stockMovement} style={{ marginTop: 14 }}>
              <input type="hidden" name="batchId" value={b.id} /><input type="hidden" name="back" value={`/admin/batches/${b.id}`} />
              <FormGrid>
                <F label="Variant" name="variantId" required options={b.product.variants.map((v) => ({ value: v.id, label: v.label }))} />
                <F label="Movement" name="type" required options={[
                  { value: "QC_APPROVED", label: "Packed units received into stock (+)" }, { value: "CUSTOMER_RETURN", label: "Customer return (+)" },
                  { value: "DAMAGED", label: "Damaged (−)" }, { value: "EXPIRED", label: "Expired (−)" }, { value: "PACKAGING_LOSS", label: "Packaging loss (−)" },
                  { value: "MANUAL_ADJUSTMENT", label: "Manual adjustment (signed)" },
                ]} />
                <F label="Units" name="quantity" type="number" required hint="Whole packs. For manual adjustment use a negative number to remove." />
                <F label="Reason" name="reason" required />
              </FormGrid>
              <button className="btn btn-sm" style={{ marginTop: 10 }}>Record movement</button>
            </form>
          </Card>
          <Card title="Record inspection">
            <form action={addInspection}>
              <input type="hidden" name="batchId" value={b.id} />
              <FormGrid>
                <F label="Result" name="result" required options={[{ value: "PASSED", label: "Passed" }, { value: "CONDITIONAL", label: "Conditional" }, { value: "FAILED", label: "Failed (rejects batch)" }]} />
                <F label="Grade" name="grade" defaultValue={b.qualityGrade} />
                <F label="Visual" name="visual" placeholder="pass / notes" />
                <F label="Odour" name="odour" placeholder="pass / notes" />
                <F label="Moisture" name="moisture" placeholder="within limit / value" />
                <F label="Foreign matter" name="foreignMatter" placeholder="within limit / value" />
                <F label="Notes" name="notes" type="textarea" rows={2} wide />
              </FormGrid>
              <button className="btn btn-sm" style={{ marginTop: 10 }}>Save inspection</button>
            </form>
            <ul style={{ listStyle: "none", marginTop: 14, display: "grid", gap: 8, fontSize: 13.5 }}>
              {b.inspections.map((i) => <li key={i.id}><b>{i.result}</b> {i.grade ? `· ${i.grade}` : ""} · {i.inspectedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} · {i.inspector?.name ?? "—"}{i.notes ? ` — ${i.notes}` : ""}</li>)}
            </ul>
          </Card>
        </div>
      </Grid>
      <Card title="Quality reports">
        {b.reports.map((r) => (
          <p key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
            <b>{r.title}</b> {r.laboratory ? `· ${r.laboratory}` : ""} {r.isVerified ? <Badge tone="red">verified</Badge> : <Badge tone="line">unverified</Badge>} {r.isDemo ? <Badge>demo</Badge> : null} {r.fileUrl ? <a className="link" href={r.fileUrl} target="_blank" rel="noopener noreferrer">PDF</a> : <span className="muted-note">no file</span>}
            {r.summary ? <><br /><span className="muted-note">{r.summary}</span></> : null}
          </p>
        ))}
        <form action={addReport} encType="multipart/form-data" style={{ marginTop: 14 }}>
          <input type="hidden" name="batchId" value={b.id} />
          <FormGrid>
            <F label="Title" name="title" required />
            <F label="Laboratory" name="laboratory" />
            <F label="Issued on" name="issuedAt" type="date" />
            <F label="PDF (max 10 MB)" name="file" type="file" accept="application/pdf" />
            <F label="Summary (public)" name="summary" type="textarea" rows={2} wide />
            {user.role === "ADMIN" ? <F label="Verified laboratory report (requires PDF)" name="isVerified" type="checkbox" /> : null}
            <F label="Demo record" name="isDemo" type="checkbox" />
          </FormGrid>
          <button className="btn btn-sm" style={{ marginTop: 10 }}>Add report</button>
        </form>
      </Card>
      <Card title="Movement history (latest 30)">
        <div className="table-wrap"><table className="table">
          <thead><tr><th>When</th><th>Variant</th><th>Type</th><th>Qty</th><th>On hand / reserved after</th><th>Reason</th><th>By</th></tr></thead>
          <tbody>
            {b.movements.map((m) => (
              <tr key={m.id}>
                <td>{m.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</td><td>{m.variant.label}</td><td>{m.type}</td><td className="tnum">{m.quantity > 0 ? "+" : ""}{m.quantity}</td>
                <td className="tnum">{m.onHandAfter ?? "—"} / {m.reservedAfter ?? "—"}</td>
                <td>{m.reason}{m.order ? <> · <Link className="link mono" href={`/admin/orders/${m.order.id}`}>{m.order.reference}</Link></> : null}</td>
                <td>{m.actor?.name ?? "customer/system"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </>
  );
}
