import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { listZones } from "@/server/delivery";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";
import { AddressEditor } from "@/components/account/AddressEditor";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUserPage("/account/addresses");
  const { t } = await getT();
  const [addresses, zones] = await Promise.all([
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    listZones(),
  ]);
  const zoneData = zones.map((z) => ({ division: z.division, district: z.district, areas: z.areas }));
  return (
    <div className="narrow">
      <h1 className="h1" style={{ marginBottom: 24 }}>{t("account.addresses")}</h1>
      {addresses.length === 0 ? <p style={{ marginBottom: 20 }}>{t("account.noAddresses")}</p> : (
        <ul style={{ listStyle: "none", display: "grid", gap: 12, marginBottom: 28 }}>
          {addresses.map((a) => (
            <li key={a.id} className="surface" style={{ padding: 18 }}>
              <p><b className="serif" style={{ fontSize: 18, fontWeight: 500 }}>{a.label}</b> {a.isDefault ? <span className="badge badge-red">{t("account.default")}</span> : null}</p>
              <p>{a.recipient} · {a.phone}</p>
              <p>{a.line1}, {a.area}, {a.district}, {a.division}</p>
              {a.landmark ? <p className="muted-note">{a.landmark}</p> : null}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <AddressEditor zones={zoneData} initial={{ ...a }} label={t("common.edit")} />
                {!a.isDefault ? <form action={setDefaultAddressAction}><input type="hidden" name="id" value={a.id} /><button className="btn btn-sm">{t("account.makeDefault")}</button></form> : null}
                <form action={deleteAddressAction}><input type="hidden" name="id" value={a.id} /><button className="btn btn-ghost btn-sm">{t("common.delete")}</button></form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddressEditor zones={zoneData} label={t("account.addAddress")} primary />
    </div>
  );
}
