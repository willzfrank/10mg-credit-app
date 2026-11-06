# 10mg-credit

A multi-tenant lending front end. Each lender ("tenant") gets its own branding and loan settings. Lender admins manage applications from a dashboard, and customers apply for and track loans from a portal. There is no backend: a mock API sits behind the same function boundary a real one would.

## Setup

```bash
npm install
npm run dev
```

| Script            | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Vite dev server                             |
| `npm run build`   | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the production build locally          |
| `npm run lint`    | ESLint                                      |
| `npm test`        | Vitest (jsdom), run once                    |

Optional environment variables:

| Variable              | Effect                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `VITE_DEFAULT_TENANT` | Tenant used when nothing else identifies one (default `acme`)       |
| `VITE_BASE_DOMAIN`    | Enables subdomain tenants, e.g. `acme.example.com` with `example.com` |

## Demo tenants and logins

Open a tenant with a query parameter. The choice is remembered for the browser session.

- Acme Microfinance (NGN): `http://localhost:5173/?tenant=acme`
- Zenith Credit (USD): `http://localhost:5173/?tenant=zenith`

All passwords are `password123`.

| Tenant | Role         | Email               |
| ------ | ------------ | ------------------- |
| acme   | lender admin | `ada@acme.test`     |
| acme   | customer     | `chidi@acme.test`   |
| acme   | customer     | `bola@acme.test`    |
| acme   | customer     | `emeka@acme.test`   |
| zenith | lender admin | `zed@zenith.test`   |
| zenith | customer     | `zoe@zenith.test`   |
| zenith | customer     | `ravi@zenith.test`  |
| zenith | customer     | `mina@zenith.test`  |

Credentials only work on their own tenant. Lender admins land on `/admin`, customers on `/portal`; visiting the other area redirects you to your own.

## Routes

- `/login`: tenant-branded sign in
- `/admin`: KPI cards plus Applications, Customers and Repayments tabs (approve or reject pending applications)
- `/admin/settings`: edit name, logo (URL or image upload), three colours and loan settings, with a live preview that sits above the form on mobile
- `/portal`: my loans
- `/portal/apply`: loan application form
- `/portal/loans/:id`: loan details, status timeline, repayment history and a form to make repayments

## Architecture

**Tenant resolution to theme.** `resolveTenantSlug` picks the tenant from `?tenant=`, then the subdomain (if `VITE_BASE_DOMAIN` is set), then the slug remembered in `sessionStorage`, then `VITE_DEFAULT_TENANT`. `TenantProvider` fetches that tenant's config with React Query and applies it by setting `--primary`, `--secondary` and `--accent` on `:root`. A readable foreground colour is computed for each. Unknown tenants show a "not found" screen and failed loads show a retry button. The rest of the app reads the config with `useTenant()`.

**Mock API boundary.** Components never touch the mock data. They call hooks, which call plain async functions in `features/*/api.ts` (and `shared/auth/authApi.ts`). Those functions wait 50 ms and read or write in-memory data in `mocks/db.ts` and `mocks/tenants.ts`. Replacing them with `fetch` calls would not change the UI code.

**Token-only tenant isolation.** API functions take a token, never a tenant id. The tenant and role come from the token's owner on the "server" side, and every read and write is scoped to that tenant. A customer asking for another customer's or another tenant's loan gets `NotFoundError`; a customer calling a lender-only function gets `ForbiddenError`. Dashboard functions additionally require the `lender_admin` role.

**Sessions.** Sessions are kept per tenant in a zustand store. A 401 from any query or mutation (except the public `tenant` config fetch) logs that tenant out, and `RequireRole` then redirects to `/login`.

**Money.** All amounts are integer minor units (kobo or cents). `formatMoney` is the one place they are converted for display. Total payable is principal plus simple annual interest pro-rated by tenor; outstanding is total payable minus repayments and is computed, never stored.

**Repayments.** `makeRepayment` lets a customer pay their own approved loan. It rejects non-positive, fractional-minor-unit and over-balance amounts, and the payment that clears the balance moves the loan to `repaid`. The portal and lender dashboard queries are invalidated afterwards, so outstanding balances and repayment activity update in both places.

**Logo upload.** The settings page reads a chosen PNG, JPEG, WebP, GIF or SVG file (up to 200 KB) into a data URL and stores it in `logoUrl`, next to the URL option. The same zod schema validates both forms, and the live preview shows the logo before saving.

**Code splitting.** Each page is loaded with `React.lazy` behind a `Suspense` boundary in `App.tsx`, so the initial bundle only carries the shell and the page being visited.

**Idempotent applications.** `submitApplication` takes an idempotency key. Repeating the same key and body returns the original loan; the same key with a different body is a `ConflictError`.

## Responsiveness

Layouts have been checked and fixed for phone, tablet and desktop widths. Tables become card lists on small screens, the sidebar collapses into a sheet, and on the settings page the live preview is shown above the form on mobile so edits are visible straight away.

## Decisions and trade-offs

- **Vite over Next.js**: both are on the preferred list. This app is an authenticated dashboard and portal behind a login, so there are no public pages that need SEO or server rendering, and no server code to run. Vite gives fast dev startup and a plain static build that any static host can serve. Moving to Next.js later would mainly mean swapping the router and tenant resolution for middleware.
- **Plain mock functions instead of MSW**: no service worker and no extra dependency, and tests call the same functions the UI does. The cost is that nothing exercises real HTTP (status codes, headers, serialisation).
- **Session in `sessionStorage`**: the zustand store is the source of truth at runtime and mirrors each session to `sessionStorage` so a reload keeps you signed in. The mock token table is mirrored the same way so those tokens still validate. The mirroring in `mocks/db.ts` exists only because the "server" lives in the page; a real backend would not need it.
- **Status filter in the browser**: the loan list is fetched once and filtered client-side. With pagination the filter would move to the server and into the query key.
- **Contrast warning only**: a low-contrast primary colour shows a warning but never blocks saving.

## Production notes

- Resolve tenants from subdomains (`VITE_BASE_DOMAIN` is already supported) and serve the app from a wildcard domain. `vercel.json` rewrites every path to `index.html` for client-side routing.
- Replace the mock functions with a real API, or MSW during development.
- Use short-lived access tokens with refresh tokens in `httpOnly` cookies instead of storing tokens in the browser.
- Enforce tenant isolation in the database, for example Postgres row-level security keyed on `tenant_id`, not only in application code.
- Back idempotency with a unique constraint on `(tenant_id, user_id, idempotency_key)`.
- Hash passwords and rate-limit login.

## Known limitations

- Loans, repayments and tenant config edits live in memory and reset on a full reload. Only sessions and the mock token table survive it.
- No pagination, search, sorting, export or charts.
- The contrast warning checks the primary colour against white only.
- Uploaded logos are stored as data URLs in memory. A real backend would store the file in object storage (for example S3) and save its URL.
- Authentication is a mock: plain-text passwords and no refresh or expiry.
- Tests cover the API layer and key flows in jsdom. They do not check visual layout; responsiveness was checked by hand in the browser.
- Repayments are recorded instantly with no payment provider, and there is no repayment schedule or late fees.
