import { requireAdminPage } from "@/server/auth/guards";
import { getSettings } from "@/server/settings";
import { saveSettings } from "@/app/actions/admin/system";
import { Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const s = await getSettings();
  const defs = (s.originClassDefinitions ?? {}) as Record<string, string>;
  return (
    <>
      <PageHeader title="Settings" subtitle="Administrator only. Changes are recorded in the audit log." />
      <Flash sp={sp} />
      <form action={saveSettings}>
        <Card title="Store">
          <FormGrid>
            <F label="Site name" name="siteName" defaultValue={s.siteName} required />
            <F label="Currency" name="currency" defaultValue={s.currency} required options={[{ value: "BDT", label: "BDT (৳)" }]} />
            <F label="Default language" name="defaultLanguage" defaultValue={s.defaultLanguage} required options={[{ value: "EN", label: "English" }, { value: "BN", label: "বাংলা" }]} />
            <F label="Tax rate (%)" name="taxRatePercent" type="number" step="0.01" defaultValue={s.taxRatePercent} required hint="Prices are tax-inclusive. Recorded for reporting." />
            <F label="Demo mode (show demonstration-data banners)" name="demoMode" type="checkbox" checked={s.demoMode} wide />
          </FormGrid>
        </Card>
        <Card title="Orders & delivery">
          <FormGrid>
            <F label="Minimum order (BDT)" name="minOrder" type="number" step="0.01" defaultValue={s.minOrderMinor / 100} required />
            <F label="Require email at checkout" name="requireEmail" type="checkbox" checked={s.requireEmail} />
            <F label="Order cut-off hour for next-day delivery (0–23, Dhaka time)" name="orderCutoffHour" type="number" defaultValue={s.orderCutoffHour} required />
            <F label="Booking window (days ahead)" name="bookingWindowDays" type="number" defaultValue={s.bookingWindowDays} required />
          </FormGrid>
          <p className="muted-note" style={{ marginTop: 10 }}>Delivery fees, free-delivery thresholds and slots are managed per zone in Delivery.</p>
        </Card>
        <Card title="Contact">
          <FormGrid>
            <F label="Phone" name="contactPhone" defaultValue={s.contactPhone} />
            <F label="Email" name="contactEmail" defaultValue={s.contactEmail} />
            <F label="Address" name="contactAddress" defaultValue={s.contactAddress} />
            <F label="Concierge hours" name="conciergeHours" defaultValue={s.conciergeHours} />
          </FormGrid>
        </Card>
        <Card title="Origin class definitions">
          <p className="muted-note" style={{ marginBottom: 10 }}>Shown to customers wherever O1/O2/O3 appears. Leave empty to show “definition pending”.</p>
          <FormGrid>
            <F label="O1" name="o1" defaultValue={defs.O1} wide />
            <F label="O2" name="o2" defaultValue={defs.O2} wide />
            <F label="O3" name="o3" defaultValue={defs.O3} wide />
          </FormGrid>
        </Card>
        <button className="btn btn-primary">Save settings</button>
      </form>
    </>
  );
}
