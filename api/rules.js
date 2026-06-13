import { google } from 'googleapis';

const RULES_SHEET_ID = process.env.RULES_SHEET_ID;
const SHEET_NAME = 'Rules';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: RULES_SHEET_ID,
        range: `${SHEET_NAME}!A:C`,
      });

      const rows = response.data.values || [];
      const data = rows.slice(1).filter(r => r[0] && r[1]);
      const rules = data.map((r, i) => ({ id: i + 1, vendor: r[0], category: r[1], source: r[2] || 'user' }));
      return res.json({ rules });
    }

    if (req.method === 'POST') {
      const { rules } = req.body;
      const values = [['vendor', 'category', 'source'], ...rules.map(r => [r.vendor, r.category, r.source || 'user'])];

      await sheets.spreadsheets.values.update({
        spreadsheetId: RULES_SHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      // Clear any leftover rows below the new data
      const clearStart = values.length + 1;
      await sheets.spreadsheets.values.clear({
        spreadsheetId: RULES_SHEET_ID,
        range: `${SHEET_NAME}!A${clearStart}:C1000`,
      });

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
