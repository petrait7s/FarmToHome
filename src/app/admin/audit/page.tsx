import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/auth/guards";
import { PageHeader, Pager } from "@/components/admin/AdminUI";

export const metadata = { title: "Audit log" };

export default async function Audit({ searchParams }: { searchParams: Promise<{ entity?: string; page?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.entity ? { entity: sp.entity } : {};
  const [rows, count, entities] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50, include: { actor: { select: { name: true, role: true } } } }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Audit log" subtitle={`${count} entries · important admin operations are recorded with actor, time and IP.`} />
      <form className="surface" style={{ padding: 14, display: "flex", gap: 10, marginBottom: 16 }}>
        <select name="entity" className="select" defaultValue={sp.entity ?? ""} aria-label="Entity" style={{ width: "auto" }}><option value="">All entities</option>{entities.map((e) => <option key={e.entity}>{e.entity}</option>)}</select>
        <button className="btn btn-sm btn-primary">Filter</button>
      </form>
      <div className="table-wrap"><table className="table">
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th><th>IP</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</td>
              <td>{r.actor ? `${r.actor.name} (${r.actor.role})` : "system"}</td>
              <td>{r.action}</td><td>{r.entity} <span className="muted-note mono">{r.entityId?.slice(-8)}</span></td>
              <td className="muted-note mono" style={{ maxWidth: 360, overflowWrap: "anywhere" }}>{r.data ? JSON.stringify(r.data) : ""}</td>
              <td className="muted-note">{r.ip ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <Pager page={page} pages={Math.ceil(count / 50)} base={`/admin/audit${sp.entity ? `?entity=${encodeURIComponent(sp.entity)}` : ""}`} />
    </>
  );
}
