module.exports = (req, res) => {
  // Set Header CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Tangani OPTIONS
  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    if (typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  }

  const sendResponse = (statusCode, payload) => {
    if (typeof res.status === 'function') {
      return res.status(statusCode).json(payload);
    }
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(payload));
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return sendResponse(500, { error: 'GEMINI_API_KEY belum dipasang di Vercel.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return sendResponse(400, { error: 'Body JSON tidak valid.' });
      }
    }

    const { messages } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return sendResponse(400, { error: 'Messages tidak valid.' });
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

    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      }
    )
      .then((geminiRes) => geminiRes.json().then((data) => ({ status: geminiRes.status, ok: geminiRes.ok, data })))
      .then(({ status, ok, data }) => {
        if (!ok) {
          return sendResponse(status || 500, {
            error: data?.error?.message || 'Gemini API gagal.'
          });
        }

        const parts = data?.candidates?.[0]?.content?.parts;
        const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('').trim() : '';

        return sendResponse(200, { text });
      })
      .catch((err) => {
        return sendResponse(500, { error: err.message || 'Fetch Gemini Error' });
      });

  } catch (error) {
    return sendResponse(500, { error: error?.message || 'Server Internal Error' });
  }
};
