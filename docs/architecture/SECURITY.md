# Security model

| Area | Implementation |
|---|---|
| Passwords | bcrypt (cost 12). Login against an unknown account still performs a bcrypt comparison to avoid timing differences. |
| Sessions | 32-byte random token in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). Only an HMAC-SHA256 of the token (keyed by `SESSION_SECRET`) is stored. 30-day expiry; suspended users lose access immediately; changing or resetting a password signs out other devices. |
| Password reset | Single-use random token, stored hashed, valid one hour. The response is identical whether or not the account exists. Reset links are shown on screen only in development. |
| Authorisation | Admin layout requires STAFF/ADMIN (customers get 404). **Every** admin server action re-checks the role; settings, team, audit, product deletion and verified reports require ADMIN. Orders, addresses, saved markets, favourites, notifications and concierge threads are always queried with the owner's user ID. Guest orders are visible only with a secret link token compared in constant time. |
| CSRF | Server Actions: Next.js Origin/Host check. JSON cart API: explicit same-origin check on POST. Cookies are `SameSite=Lax`. |
| Input validation | Zod schemas on every server action and route handler; Bangladesh phone normalisation; internal-only redirect targets (`next` parameter) and content links. |
| Price and stock integrity | The client sends only variant IDs and quantities. Prices, discounts, delivery fees, totals, slot capacity and stock are recomputed inside one database transaction at checkout, with conditional `UPDATE … WHERE` statements so concurrent orders cannot oversell stock or overbook slots. Orders carry a unique idempotency key. |
| Rate limiting | PostgreSQL-backed fixed windows (works across instances): login (per IP and per identifier), registration, password reset, checkout, promo attempts, concierge requests and replies, cart API. |
| Uploads | Size limits (5 MB images, 10 MB PDFs) and magic-byte checks (JPEG/PNG/WebP/PDF only; no SVG). Random file names. |
| Output | React escaping everywhere. `dangerouslySetInnerHTML` is used only for SVG generated server-side from whitelisted inputs (product illustration keys, QR codes). |
| Headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` removed. Add HSTS and a Content-Security-Policy at the edge/proxy in production. |
| Secrets | Only in environment variables, validated at start-up (`src/lib/env.ts`). Nothing secret is sent to the browser. |
| Audit | Admin operations (status changes, payments, stock movements, catalogue edits, settings, roles) write `AuditLog` rows with actor, entity, data and IP. |
| Payments | No card or wallet data is collected. Simulated providers are labelled in the UI and in payment records (`isSimulated`). Payment status changes follow an allowed-transition table and are recorded as events. |
| Demo data | `isDemo` flags on producers, products, batches, procurements and reports drive "Demo data" labels; seeding is refused in production. Quality reports can only be marked verified by an administrator and only with the laboratory PDF attached. |

## Known limitations / next steps

- Email/SMS delivery uses a console driver; connect a provider in `src/server/mail.ts` before relying on password resets in production.
- Upload storage is local disk; use an S3-compatible driver for multi-instance deployments.
- Add a Content-Security-Policy with nonces once third-party scripts (analytics, payment SDKs) are known.
- Consider two-factor authentication for administrator accounts.
