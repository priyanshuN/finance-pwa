# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server (frontend only — API won't work without env vars)
npm run build    # Vite production build (JSX only, no TypeScript)
npm run preview  # Serve the production build locally
vercel dev       # Full-stack local dev (runs frontend + /api/* serverless functions)
```

## Architecture

**Frontend**: React 18 (JSX, no TypeScript), Vite, vanilla CSS custom properties (no Tailwind). All styling uses CSS variables defined in `src/index.css` — dark mode is handled via `@media (prefers-color-scheme: dark)`.

**Backend**: Single Vercel serverless function at `api/transactions.js`. Reads from a Google Sheet using a service account. Returns `{ transactions: [...] }`. Cached at the edge for 5 minutes (`s-maxage=300`).

**Data flow**: `useTransactions` hook → `/api/transactions` → Google Sheets API → parsed rows → passed as props down to all page components. There is no global state manager — data flows top-down from `App.jsx`.

**State persistence**: Budget limits are stored in `localStorage` via `src/lib/storage.js`. No other client-side persistence.

## Key conventions

- All monetary values are in INR (₹). Use `formatINR` (abbreviated) or `formatINRFull` (full) from `src/lib/utils.js`.
- Transaction shape: `{ message_id, date (YYYY-MM-DD), vendor, category, amount (float), account_type ('UPI'|'Credit Card'|'Debit Card'), direction ('debit'|'credit'), raw_subject }`.
- Category colors are centralised in `CATEGORY_COLORS` in `src/lib/utils.js` — add new categories there.
- Components use inline styles throughout (no CSS modules or class names), with `.mono` (JetBrains Mono) and `.fade-up` as the only utility classes.
- Charts use `recharts` (BarChart, LineChart via ResponsiveContainer) — see `Trends.jsx` for patterns.
- CSV export is handled by `src/lib/export.js` (`exportTransactions`, `transactionsToCSV`, `downloadCSV`).
- User feedback uses `useToast` → `toast(message, type)` → rendered by `<ToastContainer>` in `App.jsx`. Toast types: `'success'`, `'error'`.
- Budget limits are managed by `useBudget` (reads/writes `localStorage` via `storageGet`/`storageSet` with the `finance_budgets` key).

## Environment variables

Required in Vercel (or `.env.local` for `vercel dev`):
- `SHEET_ID` — Google Sheet ID
- `GOOGLE_SERVICE_ACCOUNT_JSON` — full service account JSON (stringified)

## Deployment

**Production** is tag-driven via GitHub Actions — never auto-deploys on push to `main`:
```bash
git tag v1.2.3
git push origin v1.2.3   # triggers .github/workflows/deploy.yml → Vercel production
```

**Preview** deploys are automatic on every PR to `main` via Vercel GitHub integration.

**Branch protection**: `main` requires a PR with passing `scan` (gitleaks) and `build` checks. Direct pushes are blocked.

**Secret scanning**: pre-commit hook via gitleaks. Activate once per clone:
```bash
git config core.hooksPath .githooks
```

After running `git filter-repo`, the `origin` remote is removed and must be re-added:
```bash
git remote add origin git@github-personal:priyanshuN/finance-pwa.git
```
