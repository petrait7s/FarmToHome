import Link from "next/link";
import styles from "./BrandLogo.module.css";

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className={styles.mark}>
      <circle cx="24" cy="15" r="11" fill="#FF4B33" />
      <circle cx="15" cy="23" r="10" fill="#DDAA72" />
      <circle cx="26" cy="25" r="12" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function BrandLogo({ tagline, onRed = false }: { tagline?: string; onRed?: boolean }) {
  return (
    <Link href="/" className={`${styles.logo} ${onRed ? styles.onRed : ""}`} aria-label="FarmToHome — home">
      <BrandMark />
      <span className={styles.text}>
        <span className={styles.name}>FarmToHome</span>
        {tagline ? <span className={styles.tagline}>{tagline}</span> : null}
      </span>
    </Link>
  );
}
