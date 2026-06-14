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
    const { messages, context } = req.body;
    if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages required' });

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4-6',
      messages: [
        {
          role: 'system',
          content: `You are a helpful personal finance assistant for an Indian user. Answer questions about their spending clearly and concisely. Format all amounts in Indian Rupees (₹). Always use markdown formatting: **bold** for key amounts and vendor names, bullet lists for category breakdowns, inline \`code\` for dates or account names. For month summaries, use a short bullet list of top categories with amounts, then a bold total. Keep responses brief — 2–4 sentences for simple questions, a short structured list for breakdowns or summaries.\n\nUser's financial data:\n${context}`,
        },
        ...messages,
      ],
      max_tokens: 800,
    });

    return res.json({ reply: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
