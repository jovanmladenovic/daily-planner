// Local dev proxy server — runs alongside `vite dev`
// Start with: node server.js
// Vite proxies /api/* to this server (see vite.config.js)
// Requires ANTHROPIC_API_KEY in .env.local

import 'dotenv/config';
import http from 'http';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/suggest-steps') {
    res.writeHead(404);
    return res.end('Not found');
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', async () => {
    try {
      const { taskTitle } = JSON.parse(body);
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Set ANTHROPIC_API_KEY in .env.local' }));
      }

      const prompt = `Break the following task into 3-5 clear, actionable sub-steps.\nReturn ONLY a JSON array of strings, no markdown, no explanation.\nTask: "${taskTitle}"`;

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
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

      const data = await upstream.json();
      const text = data.content?.[0]?.text ?? '[]';

      let suggestions;
      try {
        suggestions = JSON.parse(text);
      } catch {
        suggestions = text.split('\n').filter(Boolean);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ suggestions }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Dev API proxy running on http://localhost:${PORT}`);
});
