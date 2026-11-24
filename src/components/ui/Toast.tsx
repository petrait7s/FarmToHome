"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import styles from "./Toast.module.css";

type ToastItem = { id: number; message: string; actionLabel?: string; onAction?: () => void; leaving?: boolean };
type Ctx = { show: (message: string, action?: { label: string; onClick: () => void }) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 280);
  }, []);

  const show = useCallback<Ctx["show"]>(
    (message, action) => {
      const id = ++idRef.current;
      setItems((list) => [...list.slice(-1), { id, message, actionLabel: action?.label, onAction: action?.onClick }]);
      setTimeout(() => dismiss(id), action ? 5200 : 2800);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${t.leaving ? styles.out : ""}`} role="status">
            <span className={styles.dot} aria-hidden="true" />
            <span>{t.message}</span>
            {t.actionLabel ? (
              <button type="button" onClick={() => { t.onAction?.(); dismiss(t.id); }}>{t.actionLabel}</button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
