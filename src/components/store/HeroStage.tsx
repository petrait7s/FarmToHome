"use client";

import { useEffect, useRef } from "react";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Icon } from "@/components/ui/Icon";
import styles from "./HeroStage.module.css";

type Item = { id: string; artKey: string | null; imageUrl: string | null; name: string; origin: string | null };
type Labels = { field: string; river: string; town: string; city: string; cityNote: string };

/**
 * Hero scene: a frosted-glass arched window looking out on the three things the headline
 * names — fields, rivers and settlements — with products resting on the sill.
 * Layers drift at different depths toward the pointer. Decorative only (aria-hidden).
 */
export function HeroStage({ items, labels }: { items: Item[]; labels: Labels }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    const host = el.closest("section") ?? el;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };
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
      <div className={styles.window}>
        <svg className={styles.scene} viewBox="0 0 360 440" preserveAspectRatio="xMidYMax slice">
          {/* sky and sun */}
          <g className={styles.l0}>
            <circle cx="236" cy="128" r="74" fill="#DDAA72" opacity=".22" />
            <circle className={styles.sun} cx="236" cy="128" r="44" fill="#DDAA72" />
          </g>
          {/* জনপদ — settlement on the horizon */}
          <g className={styles.l1}>
            <path d="M-20 236 Q90 214 180 226 T380 220 V260 H-20Z" fill="#F4F1EA" opacity=".18" />
            {[[26, 0], [62, 1], [104, 0], [168, 1], [214, 0], [262, 1], [306, 0]].map(([x, tall], i) => (
              <g key={i} transform={`translate(${x} ${tall ? 196 : 204})`}>
                <rect x="0" y="12" width={tall ? 30 : 24} height={tall ? 30 : 22} fill="#F4F1EA" opacity={tall ? 0.85 : 0.6} />
                <path d={tall ? "M-4 14 L15 0 L34 14Z" : "M-3 14 L12 3 L27 14Z"} fill="#0F766E" opacity=".75" />
                <rect x={tall ? 12 : 9} y={tall ? 28 : 24} width="6" height={tall ? 14 : 10} fill="#0F766E" opacity=".55" />
              </g>
            ))}
            {[[140, 186], [246, 182], [338, 190]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`} stroke="#0F766E" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".8">
                <path d="M0 50 Q2 24 0 0" />
                <path d="M0 0 Q-14 -2 -20 8 M0 0 Q14 -2 20 8 M0 0 Q-8 -10 -16 -10 M0 0 Q8 -10 16 -10" />
              </g>
            ))}
          </g>
          {/* মাঠ — paddy fields */}
          <g className={styles.l2}>
            <path d="M-20 250 Q120 238 380 252 V300 Q180 286 -20 304Z" fill="#DDAA72" opacity=".95" />
            <path d="M-20 302 Q170 284 380 298 V338 Q160 322 -20 342Z" fill="#DDAA72" opacity=".7" />
            <path d="M-20 340 Q190 320 380 336 V360 H-20Z" fill="#DDAA72" opacity=".85" />
            {/* rows of paddy seedlings */}
            {[[268, 0.7], [284, 0.55], [318, 0.5], [350, 0.45]].map(([y, o], r) => (
              <g key={r} stroke={r === 2 ? "#0F766E" : "#F4F1EA"} strokeWidth="1.4" strokeLinecap="round" opacity={o} fill="none">
                {Array.from({ length: 22 }, (_, i) => {
                  const x = (r % 2 ? 9 : 0) + i * 18 - 10;
                  const yy = y - (r === 3 ? 0 : Math.sin(i / 3) * 2);
                  return <path key={i} d={`M${x} ${yy} l-3 -7 M${x} ${yy} l0 -8 M${x} ${yy} l3 -7`} />;
                })}
              </g>
            ))}
          </g>
          {/* নদী — river with a boat */}
          <g className={styles.l3}>
            <path d="M-20 356 Q180 340 380 352 V410 H-20Z" fill="#0F766E" opacity=".92" />
            <g className={styles.waves} stroke="#F4F1EA" strokeWidth="1.4" fill="none" opacity=".55" strokeLinecap="round">
              <path d="M-40 372 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" />
              <path d="M-25 392 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" opacity=".6" />
            </g>
            <g className={styles.boat} transform="translate(92 336)">
              <path d="M0 24 Q30 36 64 24 L58 30 Q30 40 6 30Z" fill="#F4F1EA" />
              <path d="M30 24 V-12 L52 20Z" fill="#DDAA72" />
              <path d="M30 -12 L12 18 L30 20Z" fill="#F4F1EA" opacity=".8" />
            </g>
          </g>
          {/* near bank */}
          <path className={styles.l4} d="M-20 408 Q180 396 380 410 V460 H-20Z" fill="#F4F1EA" opacity=".28" />
        </svg>
        <span className={styles.glare} />
      </div>

      <span className={`${styles.tag} ${styles.tTown}`}><i />{labels.town}</span>
      <span className={`${styles.tag} ${styles.tField}`}><i />{labels.field}</span>
      <span className={`${styles.tag} ${styles.tRiver}`}><i />{labels.river}</span>

      <div className={styles.city}>
        <span className={styles.pin}><Icon name="pin" /></span>
        <span><b>{labels.city}</b><small>{labels.cityNote}</small></span>
      </div>

      <div className={styles.sill}>
        {items.slice(0, 3).map((p, i) => (
          <div key={p.id} className={`${styles.card} ${styles[`c${i}`]}`}>
            <div className={styles.art}><ProductVisual artKey={p.artKey} imageUrl={p.imageUrl} alt="" size="fill" /></div>
            <div className={styles.caption}><b>{p.name}</b>{p.origin ? <span>{p.origin}</span> : null}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
