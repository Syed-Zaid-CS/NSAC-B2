
let aiClient;

const getAIClient = async () => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing from .env");
    error.statusCode = 500;
    throw error;
  }

  if (!aiClient) {
    const { GoogleGenAI } = await import("@google/genai");
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return aiClient;
};

const generateEmbedding = async (
  text,
  taskType = "RETRIEVAL_DOCUMENT"
) => {
  if (!text || !text.trim()) {
    throw new Error("Text is required to generate an embedding");
  }

  const ai = await getAIClient();

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      taskType,
      outputDimensionality: 768,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!values || values.length !== 768) {
    throw new Error("Gemini returned an invalid embedding");
  }

  return values;
};

module.exports = { generateEmbedding };