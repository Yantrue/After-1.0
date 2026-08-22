export default async function handler(req, res) {
  // PAKSA header CORS langsung keluar di awal baris execution
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Tangani Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum dipasang di Vercel.' });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages tidak valid.' });
    }

    const safeMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === 'user' || message.role === 'model') &&
          typeof message.text === 'string' &&
          message.text.trim().length > 0
      )
      .slice(-30);

    const contents = safeMessages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text.trim() }]
    }));

    // Gunakan gemini-2.5-flash (Model paling stabil saat ini)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: data?.error?.message || 'Gemini API gagal.'
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('').trim() : '';

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Server Internal Error' });
  }
}
