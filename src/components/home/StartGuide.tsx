"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { toBanglaDigits } from "@/lib/money";
import { Icon } from "@/components/ui/Icon";
import styles from "./StartGuide.module.css";

const SIZES = [
  { value: 2, label: "1–2" },
  { value: 4, label: "3–4" },
  { value: 6, label: "5–6" },
  { value: 8, label: "7+" },
];

/** Two-question start: household size, then week or month. Opens the right market with quantities suggested for that size. */
export function StartGuide() {
  const { t, locale } = useI18n();
  const [people, setPeople] = useState(4);
  useEffect(() => {
    try {
      const v = Number(JSON.parse(localStorage.getItem("fth:household") ?? "null"));
      if (Number.isInteger(v) && v >= 1 && v <= 15) setPeople(SIZES.reduce((a, b) => (Math.abs(b.value - v) < Math.abs(a.value - v) ? b : a)).value);
    } catch { /* storage unavailable */ }
  }, []);
  const num = (s: string) => (locale === "bn" ? toBanglaDigits(s) : s);
  return (
    <section className={`section ${styles.wrap}`} aria-labelledby="guide-title">
      <div className="container">
        <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("home.guide.eyebrow")}</p>
        <h2 id="guide-title" className="h1">{t("home.guide.title")}</h2>
        <div className={styles.grid}>
          <div className={styles.step}>
            <p className={styles.q} id="guide-people"><span className={styles.n} aria-hidden="true">{num("1")}</span>{t("home.guide.people")}</p>
            <div className={styles.sizes} role="radiogroup" aria-labelledby="guide-people">
              {SIZES.map((s) => (
                <button key={s.value} type="button" role="radio" aria-checked={people === s.value} className={styles.size} onClick={() => setPeople(s.value)}>
                  {num(s.label)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.step}>
            <p className={styles.q}><span className={styles.n} aria-hidden="true">{num("2")}</span>{t("home.guide.when")}</p>
            <div className={styles.modes}>
              <Link href={`/market/weekly?people=${people}`} className={`${styles.mode} press`}>
                <span><b>{t("home.guide.week")}</b><small>{t("home.guide.weekNote")}</small></span>
                <Icon name="arrowRight" />
              </Link>
              <Link href={`/market/monthly?people=${people}`} className={`${styles.mode} ${styles.month} press`}>
                <span><b>{t("home.guide.month")}</b><small>{t("home.guide.monthNote")}</small></span>
                <Icon name="arrowRight" />
              </Link>
            </div>
          </div>
        </div>
        <p className={styles.hint}>{t("home.guide.hint")}</p>
      </div>
    </section>
  );
}
