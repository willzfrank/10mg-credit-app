# 10mg Credit

Frontend for a multi-tenant lending platform built with React, TypeScript, and Vite. Each lender gets its own branding, theme colors, and loan settings.

## Live Demo

Deployed on AWS Amplify: https://main.d1v9au6owp5356.amplifyapp.com/login/

Append `?tenant=acme` or `?tenant=zenith` to switch lenders (see Demo Accounts below).

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
- **Mock API**: Runs entirely in the browser (no backend) with simulated network delays and tenant-scoped auth. See [Mock Data](#mock-data).

## Mock Data

There is no real backend or database. The API layer (`src/app/*/api.ts`) talks to an in-browser mock database in `src/app/mocks/`:

- **Seed data**: `db.ts` (users, loans, repayments) and `tenants.ts` (the Acme and Zenith tenants, branding and loan settings).
- **Covered endpoints**: login/logout, tenant config (get/update), loans (list/get/apply), repayments (list/make), and admin dashboard data (summary, customers, repayments, approve/reject).
- **Persistence**: loans, repayments and tenant settings are saved to `localStorage` (key `10mg:db:v1`), so changes survive a page reload. Login sessions are kept in `sessionStorage`.
- **Reset to seed data**: clear site data in your browser, or run `localStorage.removeItem('10mg:db:v1')` in the console and reload.
- **Swapping in a real API**: replace the function bodies in the `api.ts` files; the UI only depends on their signatures.

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Typecheck and build
- `npm run preview` — Preview production build
- `npm test` — Run tests
- `npm run lint` — Run ESLint

## Notes

- Mock data persists in `localStorage` across reloads (see [Mock Data](#mock-data)); login sessions persist in `sessionStorage`.
- Money values are handled in minor units (cents/kobo).
