# Changelog

## v1.2.1 — 2026-06-13

### Fixed
- Recategorization now uses Claude Sonnet 4.6 (via OpenRouter) which returns clean JSON without markdown fences, resolving the empty suggestions bug.
- Chat assistant messages now render markdown (bold, lists, inline code) using `react-markdown`.
- `package.json` version kept in sync with release tags going forward.

---

## v1.2.0 — 2026-06-13

### Added
- **AI Recategorization** — on first load, Claude Haiku (via OpenRouter) classifies all `UPI / Personal` and `Other` debit transactions by vendor. Suggestions are stored as `source=llm` alias rules in the Rules Sheet and applied automatically. Requires `OPENROUTER_API_KEY`.
- **AI Suggested Rules** section in Settings — review, accept, or dismiss LLM suggestions individually or with one "Accept all" tap. Accepted suggestions are promoted to permanent user rules.
- **Chat tab** — ask free-form questions about your spending. Claude Sonnet receives the current month's totals, category breakdown, and last 40 transactions as context. Month picker applies to chat context.
- **Monthly Digest** — "Summarise this month" card in Overview calls Claude Haiku to generate a 3-sentence narrative covering top spend, a notable pattern, and an actionable insight. Resets on month change.
- **Anomaly detection** — algorithmic. Debits more than 2.5σ above a vendor's historical mean (≥3 past transactions) get a red ⚠ badge in the Transactions list alongside the existing ↻ recurring badge.

---

## v1.1.1 — 2026-06-13

### Fixed
- About section in Settings now shows version dynamically from `package.json` — no manual update needed on each release.
- Bumped `package.json` version to 1.1.0 to match v1.1.0 release.

---

## v1.1.0 — 2026-06-13

### Added
- **Alias Rules** — map vendor substrings to categories in Settings (e.g. NoBroker → Housing). Rules persist to a separate Google Sheet and cache in localStorage for instant offline access.
- **Recurring tab** — algorithmically detects fixed monthly commitments (same vendor, ≤20% amount variance, 2+ months). Shows total fixed monthly cost and PAID/PENDING badge per vendor for the current month.
- **↻ badge** on recurring transactions in the Transactions list.

### Improved
- **Bundle size** — lazy-load all tab components with `React.lazy`. Initial bundle 587KB → 152KB (74% smaller). Recharts only loads when Trends tab is opened.

### Dependencies
- Upgraded recharts v2 → v3 (no breaking changes).

### Infrastructure
- GitHub Actions now opt into Node.js 24 ahead of the June 16th forced cutover.
- New env var: `RULES_SHEET_ID` — separate Google Sheet for alias rules (service account needs Editor access).

---

## v1.0.0 — 2026-06-09

Initial release.

- Transaction dashboard reading from Google Sheets via service account.
- Overview, Transactions, Trends, Budget, Settings tabs.
- Month picker, category filters, CSV export.
- Budget limits stored in localStorage.
- Tag-driven production deploys via GitHub Actions + Vercel.
