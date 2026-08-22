const https = require('https');

module.exports = async (req, res) => {
  // Selalu set header CORS di paling atas
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Tangani Preflight OPTIONS langsung return 200 OK
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

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { messages } = body;

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

    const payload = JSON.stringify({ contents });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const apiRequest = https.request(options, (apiRes) => {
      let responseData = '';

      apiRes.on('data', (chunk) => {
        responseData += chunk;
      });

      apiRes.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);

          if (apiRes.statusCode !== 200) {
            return res.status(apiRes.statusCode).json({
              error: parsedData?.error?.message || 'Gemini API gagal.'
            });
          }

          const parts = parsedData?.candidates?.[0]?.content?.parts;
          const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('').trim() : '';

          return res.status(200).json({ text });
        } catch (e) {
          return res.status(500).json({ error: 'Gagal parse JSON dari Gemini.' });
        }
      });
    });

    apiRequest.on('error', (err) => {
      return res.status(500).json({ error: err.message || 'Request Error' });
    });

    apiRequest.write(payload);
    apiRequest.end();

  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Server Internal Error' });
  }
};
