import Link from "next/link";
import styles from "./AdminUI.module.css";

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className={styles.header}>
      <div>
        {back ? <Link href={back.href} className={styles.back}>← {back.label}</Link> : null}
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export function Flash({ sp }: { sp: { ok?: string; error?: string } }) {
  if (sp.error) return <p className="form-error" role="alert" style={{ marginBottom: 18 }}>{sp.error}</p>;
  if (sp.ok) return <p className="form-ok" role="status" style={{ marginBottom: 18 }}>{sp.ok}</p>;
  return null;
}

export function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className={styles.card}>
      {title || actions ? <div className={styles.cardHead}>{title ? <h2>{title}</h2> : <span />}{actions}</div> : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "red" }) {
  return (
    <div className={`${styles.stat} ${tone === "red" ? styles.statRed : ""}`}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {hint ? <p className={styles.statHint}>{hint}</p> : null}
    </div>
  );
}

export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={styles[`grid${cols}`]}>{children}</div>;
}

/** Labelled input for server-rendered admin forms. */
export function F({ label, name, type = "text", defaultValue, required, placeholder, hint, step, min, max, rows, options, wide, checked, accept }: {
  label: string; name: string; type?: string; defaultValue?: string | number | null; required?: boolean; placeholder?: string; hint?: string;
  step?: string; min?: number; max?: number; rows?: number; options?: { value: string; label: string }[]; wide?: boolean; checked?: boolean; accept?: string;
}) {
  const id = `f-${name}`;
  if (type === "checkbox") {
    return <label className={`check ${wide ? styles.wide : ""}`}><input type="checkbox" name={name} defaultChecked={checked} />{label}</label>;
  }
  return (
    <div className={`field ${wide ? styles.wide : ""}`}>
      <label className="label" htmlFor={id}>{label}{required ? "" : <span className="opt"> (optional)</span>}</label>
      {options ? (
        <select id={id} name={name} className="select" defaultValue={defaultValue ?? ""} required={required}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea id={id} name={name} className="textarea" defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} rows={rows ?? 4} />
      ) : (
        <input id={id} name={name} type={type} className="input" defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} step={step} min={min} max={max} accept={accept} />
      )}
      {hint ? <span className="muted-note">{hint}</span> : null}
    </div>
  );
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.formGrid}>{children}</div>;
}

export function Badge({ children, tone }: { children: React.ReactNode; tone?: "red" | "gold" | "line" }) {
  return <span className={`badge ${tone === "red" ? "badge-red" : tone === "line" ? "badge-line" : ""}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <nav className={styles.pager} aria-label="Pagination">
      {page > 1 ? <Link className="btn btn-sm" href={`${base}${sep}page=${page - 1}`}>Previous</Link> : <span />}
      <span>Page {page} of {pages}</span>
      {page < pages ? <Link className="btn btn-sm" href={`${base}${sep}page=${page + 1}`}>Next</Link> : <span />}
    </nav>
  );
}
