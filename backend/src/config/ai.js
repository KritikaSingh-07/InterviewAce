import OpenAI from "openai";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  getAIClient,
   generateAIResponse,
};
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GEMINI_MODEL = 'gemini-flash-latest';
const OPENAI_MODEL = 'gpt-4o-mini';

const generateWithGemini = async (prompt, systemPrompt) => {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(prompt);
  return result.response.text() || '';
};

const generateWithOpenAI = async (prompt, systemPrompt) => {
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content || '';
};

// Fallback logic: try Gemini first, then OpenAI
const generateAIResponses = async (prompt, systemPrompt = 'You are an expert interview coach and career advisor.') => {
  try {
    return await generateWithGemini(prompt, systemPrompt);
  } catch (geminiError) {
    console.error('Gemini API Error:', geminiError.message);
    try {
      return await generateWithOpenAI(prompt, systemPrompt);
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError.message);
      throw new Error('Failed to generate AI response');
    }
  }
};

export { generateAIResponses, generateWithGemini, generateWithOpenAI };
