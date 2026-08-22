const MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  //  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*"); // Mengizinkan semua domain
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // 2. Langsung hentikan proses jika ini request OPTIONS (Preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 3. Validasi Method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY belum dipasang di Vercel." });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages tidak valid." });
    }

    const safeMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "model") &&
          typeof message.text === "string" &&
          message.text.trim().length > 0
      )
      .slice(-30);

    const contents = safeMessages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text.trim() }]
    }));

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "Kamu adalah After 1.0, AI assistant yang ramah, natural, dan membantu."
              }
            ]
          },
          contents,
          generationConfig: { maxOutputTokens: 4096 }
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: data?.error?.message || "Gemini API gagal."
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || "").join("").trim() : "";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Server Error." });
  }
}
