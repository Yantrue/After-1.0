const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).json({
      ok: true
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY belum dipasang di Vercel."
      });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages tidak valid."
      });
    }

    const contents = messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "model") &&
          typeof message.text === "string" &&
          message.text.trim()
      )
      .slice(-30)
      .map((message) => ({
        role: message.role,
        parts: [
          {
            text: message.text.trim()
          }
        ]
      }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `
Kamu adalah After 1.0.

Nama: After 1.0
Peran: AI assistant.

Gaya:
- Ramah.
- Natural.
- Jelas.
- Langsung ke inti.
- Gunakan bahasa Indonesia jika pengguna menggunakan bahasa Indonesia.
- Gunakan bahasa Inggris jika pengguna menggunakan bahasa Inggris.
- Gunakan Markdown jika membantu.

Aturan:
- Jangan mengarang fakta.
- Jika tidak tahu, katakan tidak tahu.
- Untuk coding, berikan kode yang dapat digunakan.
- Jelaskan langkah teknis dengan jelas.
                `
              }
            ]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API gagal."
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!text) {
      return res.status(502).json({
        error: "Gemini tidak mengembalikan jawaban."
      });
    }

    return res.status(200).json({
      text
    });

  } catch (error) {
    console.error("After 1.0 error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Terjadi kesalahan pada backend."
    });
  }
}
