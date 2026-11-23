import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/auth/guards";
import { createStaff, setRole } from "@/app/actions/admin/system";
import { Badge, Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Team" };

export default async function Team({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const staff = await db.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] } }, orderBy: [{ role: "asc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader title="Team" subtitle="Staff can operate orders, sourcing and catalogue. Administrators also manage settings, team and audit." />
      <Flash sp={sp} />
      <Card title="Staff accounts">
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Last sign-in</th><th>Change role</th></tr></thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id}>
                <td>{u.name}{u.id === me.id ? " (you)" : ""}</td><td>{u.phone}</td><td>{u.email ?? "—"}</td>
                <td><Badge tone={u.role === "ADMIN" ? "red" : "line"}>{u.role}</Badge></td>
                <td>{u.lastLoginAt?.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) ?? "never"}</td>
                <td>{u.id === me.id ? "—" : (
                  <form action={setRole} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" className="select" defaultValue={u.role} style={{ minHeight: 36, padding: "4px 10px", width: "auto" }}><option>STAFF</option><option>ADMIN</option><option value="CUSTOMER">Remove staff access</option></select>
                    <button className="btn btn-sm">Apply</button>
                  </form>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
      <Card title="Add a staff member">
        <form action={createStaff}>
          <FormGrid>
            <F label="Name" name="name" required />
            <F label="Phone" name="phone" type="tel" required />
            <F label="Email" name="email" type="email" />
            <F label="Role" name="role" required options={[{ value: "STAFF", label: "Staff" }, { value: "ADMIN", label: "Administrator" }]} />
            <F label="Temporary password (min 8)" name="password" type="password" required hint="Ask them to change it after first sign-in." />
          </FormGrid>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Add staff member</button>
        </form>
      </Card>
    </>
  );
}
