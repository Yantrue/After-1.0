module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'GEMINI_API_KEY belum dipasang di Vercel.' }));
    }

    // Read body buffer/string safely
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'JSON body tidak valid.' }));
      }
    }

    const { messages } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Messages tidak valid.' }));
    }

    const safeMessages = messages
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'model') &&
          typeof m.text === 'string' &&
          m.text.trim().length > 0
      )
      .slice(-30);

    const contents = safeMessages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text.trim() }]
    }));

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      res.writeHead(geminiResponse.status || 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: data?.error?.message || 'Gemini API gagal.' }));
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('').trim() : '';

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ text }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: error?.message || 'Server Internal Error' }));
  }
};
