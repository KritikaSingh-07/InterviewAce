import OpenAI from "openai";
import Groq from "groq-sdk";

const AI_PROVIDER = (process.env.AI_PROVIDER || "groq").toLowerCase();

// OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Groq Client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getAIClient = () => {
  switch (AI_PROVIDER) {
    case "groq":
      return groq;

    case "openai":
      return openai;

    default:
      throw new Error(`Unsupported AI Provider: ${AI_PROVIDER}`);
  }
};

const getModel = () => {
  switch (AI_PROVIDER) {
    case "groq":
      return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    case "openai":
      return process.env.OPENAI_MODEL || "gpt-4o-mini";

    default:
      throw new Error(`Unsupported AI Provider: ${AI_PROVIDER}`);
  }
};

const generateAIResponse = async (
  prompt,
  systemPrompt = "You are an expert interview coach and career advisor."
) => {
  try {
    const client = getAIClient();

    console.log("==================================");
    console.log("AI Provider :", AI_PROVIDER);
    console.log("Model       :", getModel());
    console.log("==================================");

    const completion = await client.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("AI API Error:", error);

    throw new Error("Failed to generate AI response");
  }
};

export {
  generateAIResponse,
  getAIClient,
};