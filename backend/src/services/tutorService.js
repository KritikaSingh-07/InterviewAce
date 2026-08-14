import { generateAIResponses } from '../config/ai.js';

/**
 * Stage 1: Socratic Learning Response Generator
 */
const generateSocraticResponse = async (session, problem, code, language, studentMessage) => {
  // Format chat history for context
  const historyText = session.messages
    .slice(-10) // last 10 messages for context
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
    .join('\n');

  const systemPrompt = `You are an experienced Data Structures and Algorithms (DSA) instructor.
Your objective is to teach the student, not immediately solve the problem.
You are conducting Stage 1 (Socratic Learning) of a guided learning session for the problem: "${problem.title}".

Problem Description:
${problem.description}

Constraints:
${problem.constraints}

Student's Current Context:
- Programming Language: ${language}
- Current Code in Editor:
\`\`\`${language}
${code || '// No code written yet'}
\`\`\`

GUIDELINES FOR SOCRATIC LEARNING:
1. Never immediately reveal hints, pseudo-code, or implementation code.
2. Ask conceptual questions ONE AT A TIME to guide the student to the optimal solution.
3. If the student answers a question:
   - Evaluate their answer.
   - If CORRECT: Briefly explain why it is correct, praise them, and ask the next conceptual question to guide them closer to the approach (e.g. going from brute force to optimized, or details of a data structure).
   - If INCORRECT: Explain ONLY that specific concept gently, and ask an adapted question to help them understand.
4. Keep explanations concise, clear, and encouraging. Act like a friendly mentor sitting beside them.`;

  const userPrompt = `Here is the chat history so far:
${historyText || 'No history yet - this is the start of the discussion.'}

Student's latest message: "${studentMessage}"

Generate your Socratic mentor response. Remember to ask exactly ONE conceptual question to proceed.`;

  return await generateAIResponses(userPrompt, systemPrompt);
};

/**
 * Stage 2: Hint Generator (Concept, Edge Case, or Pseudo Code)
 */
const generateHint = async (problem, code, language, hintLevel) => {
  let levelName = 'Level 1: Concept Hint';
  let levelGuidelines = 'Explain only the underlying idea or concept. Do not mention edge cases, write pseudo-code, or show implementation.';
  if (hintLevel === 2) {
    levelName = 'Level 2: Edge Case Hint';
    levelGuidelines = 'Guide the student toward hidden edge cases, boundary conditions, or constraints they should consider. Do not write pseudo-code or code.';
  } else if (hintLevel === 3) {
    levelName = 'Level 3: Pseudo Code Hint';
    levelGuidelines = 'Show a high-level step-by-step algorithm/pseudo-code only. Do NOT write actual code in any programming language.';
  }

  const systemPrompt = `You are an experienced DSA instructor.
Generate a ${levelName} for the student solving the problem: "${problem.title}".

Problem Description:
${problem.description}

Student's current code:
\`\`\`${language}
${code || '// No code written yet'}
\`\`\`

GUIDELINES:
- ${levelGuidelines}
- Make the hint direct, clear, and helpful without revealing the actual implementation.
- Act as a supportive mentor.`;

  const userPrompt = `Generate the Level ${hintLevel} hint now.`;

  return await generateAIResponses(userPrompt, systemPrompt);
};

/**
 * Stage 3: Complete Solution Generator
 */
const generateSolution = async (problem, language) => {
  const systemPrompt = `You are an experienced DSA instructor.
Generate a complete structured solution for the problem: "${problem.title}" in ${language}.

Problem Description:
${problem.description}

Requirements:
Produce a detailed solution with the following sections in Markdown:
1. Complete Intuition: Explain the thought process of how to solve the problem optimally.
2. Step-by-step Algorithm: Detail the steps of the optimized approach.
3. Dry Run: Walk through a small example step-by-step with variables tracing.
4. Time Complexity: State and explain the big-O time complexity.
5. Space Complexity: State and explain the big-O space complexity.
6. Optimized Approach vs Brute Force: Briefly contrast them.
7. Full Implementation Code: Provide the complete, clean, optimized code written in ${language}. Ensure code is correct and follows standard conventions.

Prepend this EXACT sentence at the very beginning of the response:
"This solution was unlocked after completing the guided learning stages."`;

  const userPrompt = `Generate the complete solution in ${language}.`;

  return await generateAIResponses(userPrompt, systemPrompt);
};

/**
 * Post-Solution Mentorship Chat Generator
 */
const generatePostSolutionResponse = async (problem, code, language, messagesHistory, userQuery) => {
  const historyText = messagesHistory
    .slice(-10)
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
    .join('\n');

  const systemPrompt = `You are an experienced DSA instructor.
The student has already unlocked or viewed the solution to the problem: "${problem.title}".
You are now in the post-solution discussion stage.

You should act as a mentor, answering their questions and continuing their learning.
Feel free to discuss:
- Why the approach works
- Common mistakes students make with this problem
- Alternative approaches (iterative vs recursive, space/time trade-offs)
- Brute Force vs Optimized comparisons
- Follow-up interview questions standard for this problem
- Similar LeetCode questions, company tags, and difficulty progression
- Recommended next problems

Keep the tone encouraging, technical, and mentoring.`;

  const userPrompt = `Here is the chat history:
${historyText}

Student's code:
\`\`\`${language}
${code}
\`\`\`

Student's latest query: "${userQuery}"

Provide a detailed mentoring response to the student's query.`;

  return await generateAIResponses(userPrompt, systemPrompt);
};

/**
 * High-fidelity AI Code Execution Simulator
 */
const executeCodeSimulated = async (problem, code, language) => {
  const systemPrompt = `You are a high-fidelity code compilation and execution engine sandbox.
Evaluate the code submitted by the student for the problem "${problem.title}" in ${language}.

Problem description:
${problem.description}

Test Cases to run:
${JSON.stringify([...(problem.visibleTestCases || []), ...(problem.hiddenTestCases || [])], null, 2)}

Your task:
1. Parse the code for compilation, syntax, or logical errors.
2. Simulate running the code against each test case.
3. Determine stdout, stderr, and whether the output matches the expected result.
4. Produce a strict JSON object response. Do NOT add any conversational text. Do NOT wrap in markdown code blocks like \`\`\`json. Just return raw valid JSON.

The JSON schema must be:
{
  "success": true | false,
  "error": "syntax/runtime error message if success is false, else null",
  "results": [
    {
      "input": "string representation of input",
      "expected": "string representation of expected output",
      "actual": "string representation of actual output",
      "passed": true | false,
      "stdout": "printed output if any, else empty"
    }
  ]
}`;

  const userPrompt = `Evaluate the following code:
\`\`\`${language}
${code}
\`\`\``;

  try {
    const rawResult = await generateAIResponses(userPrompt, systemPrompt);
    // Parse the JSON out of the response (removing any markdown ticks if Gemini added them)
    const cleanedJson = rawResult
      .replace(/```json/i, '')
      .replace(/```/, '')
      .trim();

    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('Failed to parse AI execution simulation:', error);
    // Return a fallback error object
    return {
      success: false,
      error: 'Compilation/Execution simulation failed. Please check your syntax.',
      results: [...(problem.visibleTestCases || []), ...(problem.hiddenTestCases || [])].map((tc) => ({
        input: JSON.stringify(tc.input),
        expected: JSON.stringify(tc.expectedOutput),
        actual: 'Error',
        passed: false,
        stdout: '',
      })),
    };
  }
};

export {
  generateSocraticResponse,
  generateHint,
  generateSolution,
  generatePostSolutionResponse,
  executeCodeSimulated,
};
