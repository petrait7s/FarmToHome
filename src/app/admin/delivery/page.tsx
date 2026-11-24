import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { dhakaToday, addDays } from "@/server/delivery";
import { generateSlots, saveZone, updateSlot } from "@/app/actions/admin/operations";
import { Badge, Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Delivery" };

export default async function Delivery({ searchParams }: { searchParams: Promise<{ date?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const today = dhakaToday();
  const date = sp.date ? new Date(`${sp.date}T00:00:00.000Z`) : addDays(today, 1);
  const [zones, slots, assignments] = await Promise.all([
    db.deliveryZone.findMany({ orderBy: { name: "asc" } }),
    db.deliverySlot.findMany({ where: { date }, orderBy: [{ zone: { name: "asc" } }, { startTime: "asc" }], include: { zone: { select: { name: true } } } }),
    db.order.findMany({ where: { deliveryDate: date, status: { not: "CANCELLED" } }, orderBy: [{ slotLabel: "asc" }], include: { delivery: true } }),
  ]);
  const iso = date.toISOString().slice(0, 10);
  return (
    <>
      <PageHeader title="Delivery" subtitle="Zones, charges, time slots, capacity and the day’s delivery sheet." />
      <Flash sp={sp} />
      <Card title={`Delivery sheet — ${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}`}
        actions={<form style={{ display: "flex", gap: 8 }}><input type="date" name="date" defaultValue={iso} className="input" style={{ minHeight: 38 }} /><button className="btn btn-sm">Show</button></form>}>
        {assignments.length === 0 ? <p className="muted-note">No deliveries on this date.</p> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Slot</th><th>Order</th><th>Customer</th><th>Area</th><th>Status</th><th>Rider</th></tr></thead>
            <tbody>
              {assignments.map((o) => (
                <tr key={o.id}><td>{o.slotLabel}</td><td><Link className="link mono" href={`/admin/orders/${o.id}`}>{o.reference}</Link></td><td>{o.contactName}<br /><span className="muted-note">{o.contactPhone}</span></td><td>{o.area}</td><td><Badge tone="red">{o.status.replaceAll("_", " ")}</Badge></td><td>{o.delivery?.riderName ?? <span className="muted-note">unassigned</span>}</td></tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>

      <Card title={`Slots on ${iso}`}>
        {slots.length === 0 ? <p className="muted-note">No slots for this date. Generate them below.</p> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Zone</th><th>Time</th><th>Booked</th><th>Capacity &amp; availability</th></tr></thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id}>
                  <td>{s.zone.name}</td><td>{s.startTime}–{s.endTime}</td><td className="tnum">{s.booked}</td>
                  <td>
                    <form action={updateSlot} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="hidden" name="id" value={s.id} />
                      <input name="capacity" type="number" min={s.booked} defaultValue={s.capacity} className="input" style={{ width: 90, minHeight: 36 }} aria-label="Capacity" />
                      <label className="check"><input type="checkbox" name="active" defaultChecked={s.active} />open</label>
                      <button className="btn btn-sm">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>

      <Card title="Generate slots">
        <form action={generateSlots}>
          <FormGrid>
            <F label="Zone" name="zoneId" required options={[{ value: "all", label: "All active zones" }, ...zones.map((z) => ({ value: z.id, label: z.name }))]} />
            <F label="Starting" name="from" type="date" defaultValue={addDays(today, 1).toISOString().slice(0, 10)} required />
            <F label="Number of days" name="days" type="number" defaultValue={14} required />
            <F label="Capacity per slot" name="capacity" type="number" defaultValue={12} required />
            <F label="Time ranges" name="times" defaultValue="08:00-10:00, 10:00-12:00, 16:00-18:00, 18:00-20:00" required wide />
            <F label="Skip Fridays" name="skipFridays" type="checkbox" />
          </FormGrid>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Generate</button>
        </form>
      </Card>

      <Card title="Delivery zones & charges">
        {zones.map((z) => (
          <details key={z.id} className="surface" style={{ padding: 14, marginBottom: 10 }}>
            <summary style={{ cursor: "pointer" }}><b>{z.name}</b> · {formatMoney(z.feeMinor)} · free over {z.freeThresholdMinor ? formatMoney(z.freeThresholdMinor) : "—"} · {z.areas.join(", ")} {z.active ? null : <Badge tone="line">inactive</Badge>}</summary>
            <form action={saveZone} style={{ marginTop: 12 }}>
              <input type="hidden" name="id" value={z.id} />
              <ZoneFields z={z} />
              <button className="btn btn-sm" style={{ marginTop: 10 }}>Save zone</button>
            </form>
          </details>
        ))}
        <form action={saveZone} className="surface" style={{ padding: 14 }}>
          <p className="label" style={{ marginBottom: 8 }}>New zone</p>
          <ZoneFields z={{ division: "Sylhet", district: "Sylhet", active: true }} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>Create zone</button>
        </form>
      </Card>
    </>
  );
}

function ZoneFields({ z }: { z: Partial<{ name: string; division: string; district: string; areas: string[]; feeMinor: number; freeThresholdMinor: number | null; active: boolean }> }) {
  return (
    <FormGrid>
      <F label="Name" name="name" defaultValue={z.name} required />
      <F label="Division" name="division" defaultValue={z.division} required />
      <F label="District" name="district" defaultValue={z.district} required />
      <F label="Delivery fee (BDT)" name="fee" type="number" step="0.01" defaultValue={z.feeMinor !== undefined ? z.feeMinor / 100 : 60} required />
      <F label="Free delivery over (BDT)" name="freeThreshold" type="number" step="0.01" defaultValue={z.freeThresholdMinor ? z.freeThresholdMinor / 100 : ""} />
      <F label="Active" name="active" type="checkbox" checked={z.active ?? true} />
      <F label="Areas (comma separated)" name="areas" type="textarea" rows={2} defaultValue={z.areas?.join(", ")} required wide />
    </FormGrid>
  );
}
