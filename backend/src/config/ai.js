import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
const generateAIResponse = async (prompt, systemPrompt = 'You are an expert interview coach and career advisor.') => {
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

export { generateAIResponse, generateWithGemini, generateWithOpenAI };