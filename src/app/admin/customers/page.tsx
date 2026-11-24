import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { Badge, Empty, PageHeader, Pager } from "@/components/admin/AdminUI";

export const metadata = { title: "Customers" };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (sp.q?.trim()) where.OR = [{ name: { contains: sp.q.trim(), mode: "insensitive" } }, { phone: { contains: sp.q.trim() } }, { email: { contains: sp.q.trim().toLowerCase() } }];
  const [rows, count] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 30, take: 30, include: { _count: { select: { orders: true, savedMarkets: true } } } }),
    db.user.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Customers" subtitle={`${count} customer accounts`} />
      <form className="surface" style={{ padding: 14, display: "flex", gap: 10, marginBottom: 16 }}>
        <input name="q" className="input" defaultValue={sp.q ?? ""} placeholder="Name, phone or email" aria-label="Search customers" />
        <button className="btn btn-sm btn-primary">Search</button>
      </form>
      {rows.length === 0 ? <Empty>No customers.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Orders</th><th>Saved markets</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><Link className="link" href={`/admin/customers/${u.id}`}>{u.name}</Link></td><td>{u.phone}</td><td>{u.email ?? "—"}</td>
                <td>{u._count.orders}</td><td>{u._count.savedMarkets}</td>
                <td><Badge tone={u.status === "ACTIVE" ? "line" : "red"}>{u.status}</Badge></td>
                <td>{u.createdAt.toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pager page={page} pages={Math.ceil(count / 30)} base={`/admin/customers${sp.q ? `?q=${encodeURIComponent(sp.q)}` : ""}`} />
    </>
  );
}
