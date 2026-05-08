// Vercel / Netlify Edge Function — POST /api/suggest-steps
// Receives { taskTitle } and returns { suggestions: string[] }
// Deploy: set ANTHROPIC_API_KEY in your Vercel/Netlify environment variables

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskTitle } = req.body;
  if (!taskTitle) {
    return res.status(400).json({ error: 'taskTitle is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const prompt = `Break the following task into 3-5 clear, actionable sub-steps.\nReturn ONLY a JSON array of strings, no markdown, no explanation.\nTask: "${taskTitle}"`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(502).json({ error: 'Upstream API error', detail: err });
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '[]';

  let suggestions;
  try {
    suggestions = JSON.parse(text);
  } catch {
    suggestions = text.split('\n').filter(Boolean);
  }

  return res.status(200).json({ suggestions });
}
