"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
import styles from "./Modal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  hideTitle?: boolean;
  variant?: "center" | "sheet";
  wide?: boolean;
  closeLabel?: string;
  children: React.ReactNode;
};

/** Native <dialog> gives focus trapping, Escape to close and inert background for free. */
export function Modal({ open, onClose, title, hideTitle, variant = "center", wide, closeLabel = "Close", children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles[variant]} ${wide ? styles.wide : ""}`}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className={styles.inner}>
        {variant === "sheet" ? <span className={styles.grab} aria-hidden="true" /> : null}
        <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
          <Icon name="x" size={16} />
        </button>
        {hideTitle ? null : <h2 className={styles.title}>{title}</h2>}
        {open ? children : null}
      </div>
    </dialog>
  );
}
