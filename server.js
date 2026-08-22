import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY belum ada di file .env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json());
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Format messages tidak valid."
      });
    }

    const contents = messages.map((message) => ({
      role: message.role,
      parts: [
        {
          text: message.text
        }
      ]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: `
Kamu adalah After 1.0.

Karakter:
- Ramah dan natural.
- Jawaban jelas dan mudah dipahami.
- Jangan terlalu banyak basa-basi.
- Gunakan bahasa Indonesia jika pengguna menggunakan bahasa Indonesia.
- Gunakan Markdown jika membantu.
- Untuk coding, berikan kode yang rapi dan jelaskan bagian pentingnya.
        `,
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });

    res.json({
      text: response.text
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      error: "After 1.0 gagal menghubungi Gemini."
    });
  }
});

app.listen(PORT, () => {
  console.log(`After 1.0 aktif di http://localhost:${PORT}`);
});
