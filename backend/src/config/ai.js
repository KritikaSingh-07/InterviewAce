import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getAIClient = () => {
  // Fallback logic: try OpenAI first, then Gemini
  return openai;
};

const generateAIResponse = async (prompt, systemPrompt = 'You are an expert interview coach and career advisor.') => {
  try {
    const client = getAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('AI API Error:', error.message);
    throw new Error('Failed to generate AI response');
  }
};

export { generateAIResponse, getAIClient };

