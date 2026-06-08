import { google } from 'googleapis';

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = 'Transactions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300'); // cache 5 mins

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.json({ transactions: [] });

    const headers = rows[0];
    const transactions = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return {
        message_id:   obj.message_id,
        date:         obj.date,
        vendor:       obj.vendor,
        category:     obj.category,
        amount:       parseFloat(obj.amount) || 0,
        account_type: obj.account_type,
        direction:    obj.direction || 'debit',
        raw_subject:  obj.raw_subject,
      };
    });

    return res.json({ transactions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
