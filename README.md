# Finance Tracker PWA

Personal finance dashboard — reads from Google Sheets, deployable on Vercel.

## Deploy steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "init finance tracker"
gh repo create finance-pwa --private --push
```

### 2. Connect to Vercel
- Go to vercel.com → Add New Project → import your GitHub repo
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

### 3. Add environment variables in Vercel
Settings → Environment Variables → add:

| Key | Value |
|-----|-------|
| `SHEET_ID` | Your Google Sheet ID (from the URL) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Paste full contents of your service account JSON key |

### 4. Deploy
Vercel auto-deploys on every push. Or trigger manually from dashboard.

### 5. Add to iPhone home screen
- Open your Vercel URL in Safari
- Share → Add to Home Screen
- Done — fullscreen PWA, no browser bar

## Local dev
```bash
npm install
# create .env.local with the two env vars above
npm run dev
```
