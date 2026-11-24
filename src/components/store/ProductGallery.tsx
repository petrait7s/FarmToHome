"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./ProductGallery.module.css";

type Shot = { src: string; alt: string };

/** Main photo with selectable thumbnails. `note` labels illustrative (stock) photography. */
export function ProductGallery({ shots, note, fallback }: { shots: Shot[]; note?: string; fallback?: React.ReactNode }) {
  const [i, setI] = useState(0);
  if (!shots.length) return <div className={styles.main}>{fallback}</div>;
  const cur = shots[Math.min(i, shots.length - 1)];
  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <Image key={cur.src} src={cur.src} alt={cur.alt} fill priority={i === 0} sizes="(max-width: 900px) 100vw, 50vw" className={styles.img} />
        {note ? <span className={styles.note}>{note}</span> : null}
      </div>
      {shots.length > 1 ? (
        <div className={styles.thumbs} role="tablist">
          {shots.map((s, k) => (
            <button key={s.src} type="button" role="tab" aria-selected={k === i} aria-label={s.alt} className={styles.thumb} onClick={() => setI(k)}>
              <Image src={s.src} alt="" fill sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
