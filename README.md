# Finance Tracker PWA

A personal finance dashboard that reads SMS-parsed transactions from a Google Sheet and presents them as a mobile-first PWA. No backend database — Google Sheets is the source of truth.

## What it looks like

Five tabs: **Overview** (monthly summary + category breakdown), **Transactions** (searchable list with expandable rows), **Trends** (month-over-month charts), **Budget** (category limits with progress bars), **Settings** (export CSV, clear data).

Installable on iPhone via Safari → Share → Add to Home Screen.

## How it works

```
SMS on phone → parsing script → Google Sheet → /api/transactions → React app
```

The Vercel serverless function at `api/transactions.js` reads your Google Sheet using a service account and returns parsed transactions. The frontend caches nothing — every sync hits the API (which is edge-cached for 5 minutes).

---

## Setup

### 1. Google Sheet

Create a sheet named `Transactions` with these columns in order:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| message_id | date | vendor | category | amount | account_type | direction | raw_subject |

- `date` — `YYYY-MM-DD`
- `amount` — float (no currency symbol)
- `account_type` — `UPI`, `Credit Card`, or `Debit Card`
- `direction` — `debit` or `credit`

### 2. Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com) → create a project
2. Enable the **Google Sheets API**
3. IAM & Admin → Service Accounts → create one → create a JSON key → download it
4. Share your Google Sheet with the service account's email (Viewer access)

### 3. Fork & deploy

```bash
git clone https://github.com/priyanshuN/finance-pwa.git
cd finance-pwa
npm install

# Wire up the pre-commit secret scanner (one-time)
git config core.hooksPath .githooks
```

Create `.env.local`:
```
SHEET_ID=your_sheet_id_from_the_url
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

Run locally (full stack including the API):
```bash
vercel dev
```

### 4. Deploy to Vercel

1. Push your fork to GitHub
2. Go to [vercel.com](https://vercel.com) → Add New Project → import your repo
   - Framework: **Vite** · Build: `npm run build` · Output: `dist`
3. Add environment variables (Settings → Environment Variables):

| Key | Value |
|-----|-------|
| `SHEET_ID` | Your Google Sheet ID (from the URL) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full contents of your service account JSON key |

4. In Vercel project settings → Git → **Production Branch**: change from `main` to `never` (disables auto-deploy; releases are tag-driven)

### 5. Releasing

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the GitHub Actions deploy workflow → Vercel production. Add these three secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` |

### 6. Install on iPhone

Open your Vercel URL in Safari → Share → **Add to Home Screen** → fullscreen PWA, no browser chrome.

---

## Development workflow

```bash
vercel dev        # full-stack local dev (frontend + API)
npm run dev       # frontend only (API calls will fail without env vars)
npm run build     # production build
```

PRs to `main` require the `scan` (gitleaks) and `build` checks to pass. Direct pushes to `main` are blocked.

New machine setup — run once after cloning:
```bash
git config core.hooksPath .githooks   # activates the pre-commit secret scanner
```

## Customising

**Add a category** — add it to `CATEGORY_COLORS` in `src/lib/utils.js`.

**Change budget limits** — stored in `localStorage` under the `finance_budgets` key, managed via the Budget tab UI.

**Add a new page** — add an entry to `NAV` in `App.jsx`, create the component, add a render case in the content block.
