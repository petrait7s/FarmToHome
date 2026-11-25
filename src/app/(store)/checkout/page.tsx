import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { getCurrentCart } from "@/server/cart";
import { getCurrentUser } from "@/server/auth/session";
import { listZones } from "@/server/delivery";
import { getChosenArea } from "@/server/area";
import { quoteCart } from "@/server/quote";
import { getSettings } from "@/server/settings";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [cart, user, zones, settings, chosen] = await Promise.all([getCurrentCart(), getCurrentUser(), listZones(), getSettings(), getChosenArea()]);
  if (cart.productCount === 0) redirect("/basket");
  const { t } = await getT();
  const addresses = user ? await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];
  const quote = await quoteCart(cart, { userId: user?.id, phone: user?.phone });
  return (
    <div className="container page-pad" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <Link href="/basket" className="btn btn-ghost" style={{ marginLeft: -14 }}>← {t("common.back")}</Link>
      <p className="eyebrow" style={{ marginTop: 18 }}><span className="dot" aria-hidden="true" />{t(`saved.mode.${cart.mode}`)}</p>
      <h1 className="h1" style={{ marginTop: 10 }}>{t("checkout.title")}</h1>
      <p className="lead" style={{ marginTop: 8 }}>{t("checkout.lead")}</p>
      {!user ? <p style={{ marginTop: 12 }}><Link className="link" href="/account/login?next=/checkout">{t("checkout.signInPrompt")}</Link></p> : null}
      <CheckoutForm
        idempotencyKey={randomUUID()}
        user={user ? { name: user.name, phone: user.phone, email: user.email } : null}
        addresses={addresses.map((a) => ({ id: a.id, label: a.label, recipient: a.recipient, phone: a.phone, division: a.division, district: a.district, area: a.area, line1: a.line1, landmark: a.landmark, instructions: a.instructions }))}
        zones={zones.map((z) => ({ id: z.id, name: z.name, division: z.division, district: z.district, areas: z.areas }))}
        initialQuote={quote}
        requireEmail={settings.requireEmail}
        preferredArea={chosen ? { division: chosen.division, district: chosen.district, area: chosen.area } : null}
      />
    </div>
  );
}
