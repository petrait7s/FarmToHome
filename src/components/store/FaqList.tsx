"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./FaqList.module.css";

type Item = { id: string; q: string; a: string };

/** Searchable accordion. Filtering is client-side over the already-loaded questions. */
export function FaqList({ items, placeholder, empty }: { items: Item[]; placeholder: string; empty: string }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(term)) : items;
  }, [q, items]);
  return (
    <div>
      <label className={styles.search}>
        <Icon name="search" />
        <span className="sr-only">{placeholder}</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      </label>
      <div className={styles.list}>
        {shown.map((f) => (
          <details key={f.id} className={styles.item} open={!!q.trim() && shown.length <= 3}>
            <summary><span>{f.q}</span><Icon name="plus" /></summary>
            <p>{f.a}</p>
          </details>
        ))}
        {!shown.length ? <p className={styles.empty}>{empty}</p> : null}
      </div>
    </div>
  );
}
