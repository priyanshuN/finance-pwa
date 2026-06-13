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
- `SHEET_ID` — Google Sheet ID (transactions, service account needs Viewer)
- `RULES_SHEET_ID` — separate Google Sheet ID for alias rules (service account needs Editor)
- `GOOGLE_SERVICE_ACCOUNT_JSON` — full service account JSON (stringified)

## Release workflow

Follow these steps in order when shipping any fix or feature to production.

### 1. Raise a PR
```bash
gh auth switch --user priyanshuN   # always switch to personal account first
gh pr create --base main --head <branch> \
  --title "<type>: <short description>" \
  --body "Automated PR — summary will be posted as a comment."
```

### 2. Post a PR summary comment
```bash
PR=$(gh pr view --json number -q .number)
gh api repos/priyanshuN/finance-pwa/issues/$PR/comments \
  --method POST \
  --field body="## PR Summary

<what changed and why>"
```

### 3. Merge the PR (after CI passes)
```bash
gh pr merge $PR --merge --delete-branch
# If CI hasn't finished yet, use --auto instead and wait for checks to pass.
# Never use --admin to bypass branch protection.
```

### 4. Bump version + update CHANGELOG.md
- `main` is branch-protected — never commit directly.
- Create a dedicated branch, bump `package.json` version to X.Y.Z, add the CHANGELOG entry, commit, push, raise a PR, and merge it.

```bash
git checkout main && git pull origin main
git checkout -b chore/changelog-vX.Y.Z

# 1. Bump version in package.json to X.Y.Z
# 2. Add CHANGELOG entry at the top:
# Edit CHANGELOG.md — add new section above the previous latest version:
# ## vX.Y.Z — YYYY-MM-DD
#
# ### Fixed / Added / Changed
# - ...

git add package.json CHANGELOG.md
git commit -m "chore: bump version to vX.Y.Z and add CHANGELOG entry"
git push origin chore/changelog-vX.Y.Z

gh pr create --base main --head chore/changelog-vX.Y.Z \
  --title "docs: add CHANGELOG entry for vX.Y.Z" \
  --body "Automated PR — summary will be posted as a comment."

gh pr merge <PR> --merge --delete-branch
# Wait for scan + build checks before merging (use --auto if needed).
```

### 5. Tag the release
```bash
git checkout main && git pull origin main
git tag vX.Y.Z
git push origin vX.Y.Z   # triggers deploy.yml → Vercel production
```

---

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
