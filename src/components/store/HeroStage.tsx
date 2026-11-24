"use client";

import { useEffect, useRef } from "react";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Icon } from "@/components/ui/Icon";
import styles from "./HeroStage.module.css";

type Item = { id: string; artKey: string | null; imageUrl: string | null; name: string; origin: string | null };

/**
 * Hero product scene. Cards sit at different depths (translateZ) and the whole stage tilts
 * toward the pointer. Decorative only (aria-hidden); motion is disabled for reduced-motion users.
 */
export function HeroStage({ items, city, cityNote, trace }: { items: Item[]; city: string; cityNote: string; trace: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--rx", "0deg");
    };
    const host = el.closest("section") ?? el;
    host.addEventListener("pointermove", onMove as EventListener);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove as EventListener);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className={styles.stage} ref={ref} aria-hidden="true">
      <div className={styles.scene}>
        <span className={styles.halo} />
        {items.map((p, i) => (
          <div key={p.id} className={`${styles.card} ${styles[`c${i}`]}`}>
            <div className={styles.bob}>
              <div className={styles.art}>
                <ProductVisual artKey={p.artKey} imageUrl={p.imageUrl} alt="" size="fill" />
              </div>
              <div className={styles.caption}>
                <b>{p.name}</b>
                {p.origin ? <span>{p.origin}</span> : null}
              </div>
            </div>
          </div>
        ))}
        <div className={`${styles.chip} ${styles.city}`}>
          <span className={styles.pin}><Icon name="pin" /></span>
          <span><b>{city}</b><small>{cityNote}</small></span>
        </div>
        <div className={`${styles.chip} ${styles.trace}`}>
          <Icon name="qr" />
          <span>{trace}</span>
        </div>
      </div>
    </div>
  );
}
