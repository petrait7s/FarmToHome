import { getT } from "@/i18n";
import { getCurrentCart } from "@/server/cart";
import { getCurrentUser } from "@/server/auth/session";
import { quoteCart } from "@/server/quote";
import { BasketView } from "@/components/store/BasketView";

export const metadata = { title: "Your basket" };

export default async function BasketPage() {
  const { t } = await getT();
  const [cart, user] = await Promise.all([getCurrentCart(), getCurrentUser()]);
  const quote = await quoteCart(cart, { userId: user?.id, phone: user?.phone });
  return (
    <div className="container page-pad" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.myBasket")}</p>
      <h1 className="h1" style={{ margin: "10px 0 28px" }}>{t("basket.title")}</h1>
      <BasketView initialQuote={quote} signedIn={!!user} />
    </div>
  );
}
