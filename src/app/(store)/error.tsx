"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/client";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container narrow" style={{ padding: "96px var(--gutter)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <h1 className="h2">{t("common.error")}</h1>
      {error.digest ? <p className="muted-note mono">Ref {error.digest}</p> : null}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={reset}>{t("common.tryAgain")}</button>
        <Link className="btn" href="/">{t("common.backHome")}</Link>
      </div>
    </section>
  );
}
