import styles from "./Skeleton.module.css";

/** Layout-shaped placeholder shown while server components stream. */
export function PageSkeleton({ rows = 6, hero = true }: { rows?: number; hero?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {hero ? <div className={styles.hero} /> : null}
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={styles.row}>
            <span className={styles.thumb} />
            <span className={styles.lines}><span className={styles.line} style={{ width: "40%" }} /><span className={styles.line} style={{ width: "70%" }} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
