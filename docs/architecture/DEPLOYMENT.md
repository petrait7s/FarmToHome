# Deployment guide

## 1. Infrastructure

- **App:** Node.js 22+ running `next start` (or any Node host that supports Next.js 16). Run at least two instances behind a load balancer for availability; rate limits and sessions are stored in PostgreSQL, so instances are stateless except for local uploads (see Storage).
- **Database:** Managed PostgreSQL 16+ with daily automated backups and point-in-time recovery.
- **TLS / edge:** Terminate HTTPS at a proxy or CDN. Forward `Host`/`X-Forwarded-Host` correctly (Server Actions compare `Origin` to the host). Add `Strict-Transport-Security` and a Content-Security-Policy there.

## 2. Environment variables

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (use a pooled URL if your provider offers one). |
| `APP_URL` | Public HTTPS URL. Used in QR codes and reset links. |
| `SESSION_SECRET` | 32+ random characters (`openssl rand -base64 48`). Rotating it signs everyone out. |
| `STORAGE_DRIVER` | `local` today. |
| `MAIL_DRIVER` | `console` today. Replace before relying on password resets. |
| `NODE_ENV` | `production`. |

## 3. Release steps

```bash
npm ci
```

```bash
npx prisma migrate deploy
```

```bash
npm run build
```

```bash
npm run start
```

`npm ci` runs `prisma generate` through the `postinstall` script. Never run `prisma migrate reset` or the seed against production; the seed refuses to run when `NODE_ENV=production`.

## 4. First administrator

```bash
ADMIN_NAME="Operations Lead" ADMIN_PHONE="01XXXXXXXXX" ADMIN_EMAIL="ops@your-domain" ADMIN_PASSWORD="a-long-unique-password" npm run admin:create
```

This also creates site settings with **demo mode off**. Then sign in at `/account/login` and:

1. **Settings:** contact details, minimum order, cut-off hour, booking window, origin class definitions (O1/O2/O3).
2. **Delivery:** create zones (areas, fee, free-delivery threshold) and generate slots.
3. **Catalogue:** categories, origins, producers (verification status), products and variants, photos.
4. **Sourcing:** record procurements, receive them (creates batches), inspect each batch, attach real reports, then record packed units into stock.
5. **Content:** homepage sections (`home.hero`, `home.pilot`), collections, FAQ and **legally reviewed** policy pages.
6. **Team:** add staff accounts.

## 5. Storage

Uploads (product photos, producer photos, report PDFs) are written to `public/uploads` by the local driver. With more than one instance or an immutable filesystem, implement an S3-compatible driver in `src/server/storage.ts` (same `storeUpload` interface) and serve files from object storage/CDN. Back up the bucket.

## 6. Payments

Only Cash on Delivery is real. To add a provider (for example bKash, Nagad or SSLCommerz): implement the `PaymentProvider` interface in `src/server/payments/index.ts`, add a callback route that verifies the provider's signature and calls `setPaymentStatus`, and remove the simulated methods from checkout. Keep the payment `idempotencyKey` when calling the provider.

## 7. Monitoring and operations

- Collect server logs (stdout). Errors render with a digest reference on the customer error page.
- Add error monitoring (for example Sentry) via `instrumentation.ts` once a DSN is available.
- Watch: failed checkouts (`slot_full`, `out_of_stock`), low-stock dashboard, open concierge requests, payments in `REFUND_PENDING`.
- Housekeeping: periodically delete expired `Session`, `PasswordResetToken` and old `RateLimit` rows, and stale anonymous `Cart`s (for example a daily SQL job).

## 8. Backups and recovery

- Daily database backups kept 30 days, plus point-in-time recovery.
- Test a restore quarterly into a staging database.
- Back up upload storage with the same retention.

## 9. Readiness checklist

- [ ] Demo mode off; seed data not present in production.
- [ ] Real producer profiles have consent and correct verification status.
- [ ] Quality reports attached only where a real test exists.
- [ ] Policy pages reviewed by counsel (seed pages are marked DRAFT).
- [ ] Mail/SMS provider connected and password reset tested.
- [ ] Payment provider integrated and tested in sandbox, or checkout limited to Cash on Delivery.
- [ ] HTTPS, HSTS and CSP configured at the edge.
- [ ] Backups and restore tested; monitoring alerts configured.
- [ ] `npm run test:all` passes on the release commit.
