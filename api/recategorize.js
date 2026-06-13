import OpenAI from 'openai';
import { google } from 'googleapis';

const RULES_SHEET_ID = process.env.RULES_SHEET_ID;
const SHEET_NAME = 'Rules';
const MAX_VENDORS = 60;

const CATEGORIES = [
  'Food Delivery', 'Groceries', 'Travel', 'Travel / Stay', 'Shopping',
  'Utilities', 'Housing', 'Health', 'Subscriptions', 'Investment',
  'EMI / Loan', 'Home Services', 'Personal Care', 'Govt / Tax',
  'Income / Credit', 'Transfer', 'Cash',
];

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

async function readRules(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: RULES_SHEET_ID,
    range: `${SHEET_NAME}!A:C`,
  });
  const rows = response.data.values || [];
  return rows.slice(1)
    .filter(r => r[0] && r[1])
    .map((r, i) => ({ id: i + 1, vendor: r[0], category: r[1], source: r[2] || 'user' }));
}

async function writeRules(sheets, rules) {
  const values = [
    ['vendor', 'category', 'source'],
    ...rules.map(r => [r.vendor, r.category, r.source || 'user']),
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId: RULES_SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
  const clearStart = values.length + 1;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: RULES_SHEET_ID,
    range: `${SHEET_NAME}!A${clearStart}:C1000`,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'OpenRouter not configured' });

  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || !transactions.length) return res.json({ llmRules: [] });

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const existingRules = await readRules(sheets);
    const userRules = existingRules.filter(r => r.source === 'user');
    const coveredVendors = new Set(existingRules.map(r => r.vendor.toLowerCase()));

    // Collect unique uncategorized debit vendors not already covered
    const vendorMap = {};
    for (const t of transactions) {
      if (t.direction !== 'debit') continue;
      if (t.category !== 'UPI / Personal' && t.category !== 'Other') continue;
      if (coveredVendors.has(t.vendor.toLowerCase())) continue;
      if (!vendorMap[t.vendor]) vendorMap[t.vendor] = { amounts: [], example: '' };
      vendorMap[t.vendor].amounts.push(t.amount);
      if (!vendorMap[t.vendor].example) vendorMap[t.vendor].example = t.raw_subject || t.vendor;
    }

    const vendors = Object.keys(vendorMap).slice(0, MAX_VENDORS);
    if (!vendors.length) return res.json({ llmRules: [] });

    const vendorList = vendors.map(v => {
      const { amounts, example } = vendorMap[v];
      const avg = Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length);
      return `- "${v}" (avg ₹${avg}) — "${example}"`;
    }).join('\n');

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4-6',
      messages: [
        {
          role: 'system',
          content: `You are a personal finance classifier. You output raw JSON only — no markdown, no code fences, no explanation. Valid categories: ${CATEGORIES.join(', ')}. Output format: {"rules":[{"vendor":"...","category":"..."}]}`,
        },
        {
          role: 'user',
          content: `Classify these vendors:\n${vendorList}`,
        },
      ],
      max_tokens: 2000,
    });

    let mappings = [];
    try {
      const text = completion.choices[0].message.content || '';
      // Extract JSON object from response (handles markdown code blocks too)
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        mappings = Array.isArray(parsed.rules) ? parsed.rules : [];
      }
    } catch {
      mappings = [];
    }

    const newLlmRules = mappings
      .filter(m => m.vendor && m.category && CATEGORIES.includes(m.category))
      .map(m => ({ vendor: m.vendor, category: m.category, source: 'llm' }));

    // Persist: keep user rules, replace all LLM rules with new ones
    await writeRules(sheets, [...userRules, ...newLlmRules]);

    return res.json({ llmRules: newLlmRules });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
