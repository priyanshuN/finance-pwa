import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a concise personal finance assistant for an Indian user. Rules:
- Always use tools to fetch real data before answering. Never guess or invent numbers.
- Format amounts in Indian Rupees (₹) using Indian numbering (e.g. ₹1,13,013).
- Use markdown: **bold** for key figures, bullet lists or tables for breakdowns.
- For category/ranked lists, use a markdown table (columns: Rank, Category, Amount).
- No emojis. No filler phrases like "Great question!" or "Would you like to...". Answer directly.
- Keep responses short — one paragraph max for simple questions, a table or short list for breakdowns.`

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
    const { messages, tools } = req.body;
    if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages required' });

    const client = getClient();

    const requestBody = {
      model: 'anthropic/claude-sonnet-4-6',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    const completion = await client.chat.completions.create(requestBody);

    const msg = completion.choices[0].message;
    const toolCalls = msg.tool_calls && msg.tool_calls.length > 0 ? msg.tool_calls : null;

    return res.json({
      text: (msg.content || '').trim(),
      tool_calls: toolCalls,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
