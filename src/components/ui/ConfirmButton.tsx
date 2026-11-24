"use client";

/** Submits a server action after a native confirm() — used for destructive actions. */
export function ConfirmButton({ action, fields, label, confirm, className = "btn btn-ghost btn-sm" }: { action: (fd: FormData) => Promise<void>; fields: Record<string, string>; label: string; confirm: string; className?: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(confirm)) e.preventDefault(); }}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button className={className}>{label}</button>
    </form>
  );
}
