import { Header } from "@/components/store/Header";
import { DeliveryStrip } from "@/components/store/DeliveryStrip";
import { Footer } from "@/components/store/Footer";
import { MobileNav } from "@/components/store/MobileNav";
import { CartProvider } from "@/components/store/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { I18nProvider } from "@/i18n/client";
import { getT } from "@/i18n";
import { getCurrentCart } from "@/server/cart";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/settings";
import styles from "./store.module.css";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ t, locale, dict }, cart, user, settings] = await Promise.all([getT(), getCurrentCart(), getCurrentUser(), getSettings()]);
  return (
    <I18nProvider locale={locale} dict={dict}>
      <ToastProvider>
        <CartProvider initial={cart}>
          {settings.demoMode ? (
            <div className={styles.demo} role="note">
              <span className="dot" aria-hidden="true" />
              {t("common.demoBanner")}
            </div>
          ) : null}
          <Header />
          <DeliveryStrip />
          <main id="main" tabIndex={-1} className={styles.main}>
            {children}
          </main>
          <Footer />
          <MobileNav signedIn={!!user} />
        </CartProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
