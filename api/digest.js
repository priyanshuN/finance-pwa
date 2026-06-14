import OpenAI from 'openai';

function getClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'OpenRouter not configured' });

  try {
    const { summary } = req.body;
    if (!summary) return res.status(400).json({ error: 'summary required' });

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'anthropic/claude-haiku-4-5',
      messages: [
        {
          role: 'user',
          content: `Write a concise financial digest for an Indian user based on this spending data. No title or heading — start directly with content. Use markdown: **bold** for key ₹ amounts and category names. Structure: 1 opening sentence on total spend, then 2–3 bullet points (top category, a notable pattern, one actionable insight). Keep it tight — no waffle.\n\n${summary}`,
        },
      ],
      max_tokens: 250,
    });

    return res.json({ digest: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
