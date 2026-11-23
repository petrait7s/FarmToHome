import styles from "./OriginSeal.module.css";

/** Circular origin-class seal (O1/O2/O3). Definitions are managed in settings and may still be pending. */
export function OriginSeal({ cls, title }: { cls: string | null; title?: string }) {
  if (!cls) return null;
  return (
    <span className={styles.seal} title={title}>
      {cls}
    </span>
  );
}
