const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

exports.summarizeText = async (text) => {
  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set in environment");

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: `Summarize the following GitHub commit messages:\n\n${text}` }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 200,
      },
    };

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      body,
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated";
    return summary;
  } catch (err) {
    console.error("Gemini API error:", err.response?.status, err.response?.data || err.message);
    return "Error generating summary";
  }
};