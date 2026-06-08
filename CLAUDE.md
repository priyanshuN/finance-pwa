# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server (frontend only — API won't work without env vars)
npm run build    # TypeScript check + Vite production build
npm run preview  # Serve the production build locally
vercel dev       # Full-stack local dev (runs frontend + /api/* serverless functions)
vercel --prod    # Deploy to production (triggers on every git push to main via GitHub integration)
```

## Architecture

**Frontend**: React 18 (JSX, no TypeScript), Vite, vanilla CSS custom properties (no Tailwind). All styling uses CSS variables defined in `src/index.css` — dark mode is handled via `@media (prefers-color-scheme: dark)`.

**Backend**: Single Vercel serverless function at `api/transactions.js`. Reads from a Google Sheet using a service account. Returns `{ transactions: [...] }`. Cached at the edge for 5 minutes (`s-maxage=300`).

**Data flow**: `useTransactions` hook → `/api/transactions` → Google Sheets API → parsed rows → passed as props down to all page components. There is no global state manager — data flows top-down from `App.jsx`.

**State persistence**: Budget limits are stored in `localStorage` via `src/lib/storage.js`. No other client-side persistence.

## Key conventions

- All monetary values are in INR (₹). Use `formatINR` (abbreviated) or `formatINRFull` (full) from `src/lib/utils.js`.
- Transaction shape: `{ message_id, date (YYYY-MM-DD), vendor, category, amount (float), account_type, direction ('debit'|'credit') }`.
- Category colors are centralised in `CATEGORY_COLORS` in `src/lib/utils.js` — add new categories there.
- Components use inline styles throughout (no CSS modules or class names), with `.mono` as the only utility class (JetBrains Mono font).

## Environment variables

Required in Vercel (or `.env.local` for `vercel dev`):
- `SHEET_ID` — Google Sheet ID
- `GOOGLE_SERVICE_ACCOUNT_JSON` — full service account JSON (stringified)

## Deployment

Git push to `main` auto-deploys via Vercel GitHub integration. Each commit = one deployment. Batch related changes into one commit to avoid unnecessary builds.

After running `git filter-repo`, the `origin` remote is removed and must be re-added:
```bash
git remote add origin git@github-personal:priyanshuN/finance-pwa.git
```
