import Link from "next/link";
import { db } from "@/lib/db";
import type { ConciergeStatus } from "@/generated/prisma/client";
import { Badge, Empty, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Concierge" };

export default async function ConciergeQueue({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as ConciergeStatus[]).find((s) => s === sp.status);
  const rows = await db.conciergeRequest.findMany({ where: status ? { status } : { status: { in: ["OPEN", "IN_PROGRESS"] } }, orderBy: { createdAt: "desc" }, take: 100, include: { assignee: { select: { name: true } }, _count: { select: { messages: true } } } });
  return (
    <>
      <PageHeader title="Concierge" subtitle="Customer requests. Every request is read by a person." actions={<div style={{ display: "flex", gap: 6 }}>{["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => <Link key={s} className={`chip ${(sp.status ?? "") === s ? "is-active" : ""}`} href={s ? `/admin/concierge?status=${s}` : "/admin/concierge"}>{s || "Active"}</Link>)}</div>} />
      {rows.length === 0 ? <Empty>No requests.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Reference</th><th>Customer</th><th>Topic</th><th>Message</th><th>Status</th><th>Assignee</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link className="link mono" href={`/admin/concierge/${r.id}`}>{r.reference}</Link><br /><span className="muted-note">{r.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</span></td>
                <td>{r.name}<br /><span className="muted-note">{r.phone}</span></td>
                <td>{r.topic.replaceAll("_", " ").toLowerCase()}</td>
                <td className="muted-note">{r.message.slice(0, 90)}{r.message.length > 90 ? "…" : ""} ({r._count.messages})</td>
                <td><Badge tone={r.status === "OPEN" ? "red" : "line"}>{r.status}</Badge></td>
                <td>{r.assignee?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
