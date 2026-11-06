# 10mg Credit

Frontend for a multi-tenant lending platform built with React, TypeScript, and Vite. Each lender gets its own branding, theme colors, and loan settings.

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Demo Accounts

All accounts use the password `password123`.

### Acme Microfinance (NGN)
URL: `http://localhost:5173/?tenant=acme`

- Admin: `ada@acme.test`
- Customer: `chidi@acme.test` (also `bola@acme.test`, `emeka@acme.test`)

### Zenith Credit (USD)
URL: `http://localhost:5173/?tenant=zenith`

- Admin: `zed@zenith.test`
- Customer: `zoe@zenith.test` (also `ravi@zenith.test`, `mina@zenith.test`)

Admins are routed to `/admin` and customers to `/portal`.

## Pages & Features

- **Branding & Theming**: Theme colors and logos update dynamically per tenant.
- **Admin Dashboard (`/admin`)**: Review applications (approve/reject), view customers, and track repayments.
- **Tenant Settings (`/admin/settings`)**: Update lender logo, brand colors, and loan limits with a live preview.
- **Customer Portal (`/portal`)**: Apply for loans, view loan progress, and submit repayments.
- **Mock API**: Runs in-memory with simulated network delays and tenant-scoped auth.

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Typecheck and build
- `npm run preview` — Preview production build
- `npm test` — Run tests
- `npm run lint` — Run ESLint

## Environment Variables

- `VITE_DEFAULT_TENANT` — Fallback tenant (default: `acme`)
- `VITE_BASE_DOMAIN` — Base domain for subdomain routing (e.g. `example.com`)

## Notes

- Mock data resets on a hard browser reload, but login sessions persist in `sessionStorage`.
- Money values are handled in minor units (cents/kobo).
