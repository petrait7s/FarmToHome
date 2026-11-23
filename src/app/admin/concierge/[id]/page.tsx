import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { staffConciergeReply } from "@/app/actions/admin/operations";
import { Card, F, Flash, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Concierge request" };

export default async function ConciergeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const r = await db.conciergeRequest.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } }, user: { select: { id: true } } } });
  if (!r) notFound();
  const order = r.orderRef ? await db.order.findUnique({ where: { reference: r.orderRef }, select: { id: true } }) : null;
  return (
    <>
      <PageHeader back={{ href: "/admin/concierge", label: "Concierge" }} title={r.reference}
        subtitle={<>{r.name} · {r.phone}{r.email ? ` · ${r.email}` : ""} · {r.topic.replaceAll("_", " ").toLowerCase()}{r.user ? <> · <Link className="link" href={`/admin/customers/${r.user.id}`}>customer</Link></> : " · guest"}{order ? <> · <Link className="link" href={`/admin/orders/${order.id}`}>{r.orderRef}</Link></> : null}{r.productSlug ? <> · <Link className="link" href={`/products/${r.productSlug}`}>{r.productSlug}</Link></> : null}</>} />
      <Flash sp={sp} />
      <Card title="Conversation">
        <ul style={{ listStyle: "none", display: "grid", gap: 10 }}>
          {r.messages.map((m) => (
            <li key={m.id} style={{ padding: "12px 14px", borderRadius: 14, background: m.fromStaff ? "var(--red-06)" : "var(--sky-03)", border: "1px solid var(--line)" }}>
              <p className="muted-note">{m.fromStaff ? `${m.author?.name ?? "Staff"} (FarmToHome)` : r.name} · {m.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
            </li>
          ))}
        </ul>
        <form action={staffConciergeReply} style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <input type="hidden" name="id" value={r.id} />
          <F label="Reply to customer (also sent as an in-app notification for account holders)" name="body" type="textarea" />
          <F label="Status" name="status" defaultValue={r.status === "OPEN" ? "IN_PROGRESS" : r.status} required options={["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => ({ value: s, label: s }))} />
          <button className="btn btn-primary btn-sm" style={{ justifySelf: "start" }}>Save</button>
        </form>
      </Card>
    </>
  );
}
