import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Badge, Empty, Flash, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Promotions" };

export default async function Promotions({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const promos = await db.promotion.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { products: true, categories: true, redemptions: true } } } });
  const now = new Date();
  return (
    <>
      <PageHeader title="Promotions" subtitle="Codes are validated and counted on the server at checkout." actions={<Link className="btn btn-primary btn-sm" href="/admin/promotions/new">New promotion</Link>} />
      <Flash sp={sp} />
      {promos.length === 0 ? <Empty>No promotions.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Code</th><th>Discount</th><th>Conditions</th><th>Usage</th><th>Window</th><th>State</th></tr></thead>
          <tbody>
            {promos.map((p) => {
              const expired = p.endsAt && p.endsAt < now;
              return (
                <tr key={p.id}>
                  <td><Link className="link mono" href={`/admin/promotions/${p.id}`}>{p.code}</Link><br /><span className="muted-note">{p.description}</span></td>
                  <td>{p.type === "PERCENT" ? `${p.value}%` : formatMoney(p.value)}{p.maxDiscountMinor ? <span className="muted-note"> (max {formatMoney(p.maxDiscountMinor)})</span> : null}</td>
                  <td className="muted-note">{p.minSubtotalMinor ? `min ${formatMoney(p.minSubtotalMinor)}` : "no minimum"}{p._count.products || p._count.categories ? ` · limited to ${p._count.products} products / ${p._count.categories} categories` : ""}</td>
                  <td>{p.usedCount}{p.usageLimit !== null ? ` / ${p.usageLimit}` : ""}{p.perCustomerLimit !== null ? <span className="muted-note"> · {p.perCustomerLimit} per customer</span> : null}</td>
                  <td className="muted-note">{p.startsAt?.toLocaleDateString("en-GB") ?? "now"} – {p.endsAt?.toLocaleDateString("en-GB") ?? "open"}</td>
                  <td><Badge tone={p.active && !expired ? "red" : "line"}>{!p.active ? "inactive" : expired ? "expired" : "active"}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}
    </>
  );
}
