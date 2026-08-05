import { generateAIResponse } from "../config/ai.js";
import {
    SYSTEM_PROMPTS,
    generateInterviewPrompt,
    generateNextInterviewQuestionPrompt,
    generateOverallInterviewPrompt,
} from "../utils/aiPrompts.js";
import { MOCK_QUESTIONS } from "../mockData/interviewQuestions.js";

const USE_MOCK_AI = process.env.USE_MOCK_AI === "true";
console.log("USE_MOCK_AI =", process.env.USE_MOCK_AI);
console.log("MOCK =", USE_MOCK_AI);

export function getMockQuestions(role = "") {
    const value = role.toLowerCase();
    if (value.includes("react")) return MOCK_QUESTIONS.react;
    if (value.includes("javascript")) return MOCK_QUESTIONS.javascript;
    if (value.includes("node")) return MOCK_QUESTIONS.node;
    if (value.includes("java")) return MOCK_QUESTIONS.java;
    if (value.includes("python")) return MOCK_QUESTIONS.python;
    if (value.includes("php")) return MOCK_QUESTIONS.php;
    return MOCK_QUESTIONS.generic;
}

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------
const parseAIResponse = (response, type = "object") => {
    try {
        const regex = type === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
        const match = response.match(regex);
        return match ? JSON.parse(match[0]) : JSON.parse(response);
    } catch {
        return null;
    }
};

const retryAIRequest = async (callback, retries = 3) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await callback();
        } catch (error) {
            lastError = error;
            await new Promise((r) => setTimeout(r, 600));
        }
    }
    throw lastError;
};

/**
 * Check if a newly generated question is too similar to any previous question.
 * Uses Jaccard similarity on word tokens (threshold 0.7).
 */
function isDuplicateQuestion(newQuestion, previousQuestions) {
    if (!previousQuestions.length) return false;
    const tokenize = (str) =>
        str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const tokens1 = new Set(tokenize(newQuestion));

    for (const q of previousQuestions) {
        const tokens2 = new Set(tokenize(q.question));
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        const jaccard = intersection.size / union.size;
        if (jaccard > 0.7) return true; // very similar
    }
    return false;
}

/**
 * Adaptive difficulty calculation based on recent performance and time pressure.
 */
export const calculateNextDifficulty = (currentDifficulty, recentScores, timeUsedPercent) => {
    if (!recentScores.length) return 'easy';

    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const consistency =
        recentScores.length > 1
            ? 1 - (Math.max(...recentScores) - Math.min(...recentScores)) / 100
            : 0.5;

    // In the last 20% of time, avoid too hard questions if struggling
    const timePressure = timeUsedPercent > 0.8 ? 0.8 : 1.0;

    if (avg >= 85 && consistency > 0.7) return 'hard';
    if (avg >= 70) return 'medium';
    if (avg >= 40) return 'easy';
    return 'easy'; // struggling
};

// --------------------------------------------------------------------
// Core service functions
// --------------------------------------------------------------------

export const generateNextQuestion = async ({
    role,
    experience,
    interviewType,
    previousQuestions = [],
    currentDifficulty = "easy",
}) => {
    if (USE_MOCK_AI) {
        const mockQuestions = getMockQuestions(role);
        const idx = previousQuestions.length;
        return mockQuestions[idx] || {
            question: `Explain one challenging ${role} project you have worked on.`,
            questionType: "behavioral",
            difficulty: currentDifficulty,
        };
    }

    let prompt = generateNextInterviewQuestionPrompt({
        role,
        experience,
        interviewType,
        previousQuestions,
        currentDifficulty,
    });

    let question;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const aiResponse = await retryAIRequest(() =>
            generateAIResponse(prompt, SYSTEM_PROMPTS.NEXT_INTERVIEW_QUESTION_GENERATOR)
        );
        question = parseAIResponse(aiResponse);
        if (!question) {
            attempts++;
            continue;
        }

        // Duplicate check
        if (isDuplicateQuestion(question.question, previousQuestions)) {
            attempts++;
            prompt = generateNextInterviewQuestionPrompt({
                role,
                experience,
                interviewType,
                previousQuestions,
                currentDifficulty,
            }) + `\nWARNING: The last generated question was too similar to a previous one. Generate something completely different.`;
            continue;
        }
        break;
    }

    if (!question) {
        return {
            question: "Tell me about a challenging technical decision you made recently.",
            questionType: "behavioral",
            difficulty: currentDifficulty,
        };
    }

    return question;
};

export const generateInterviewQuestions = async (role, experience, type) => {
    if (USE_MOCK_AI) return getMockQuestions(role);

    const prompt = `Generate 5 ${type} interview questions for a ${experience}-level ${role} position. Return as JSON array with fields: question, questionType, difficulty.`;
    const aiResponse = await retryAIRequest(() =>
        generateAIResponse(prompt, SYSTEM_PROMPTS.INTERVIEW_QUESTION_GENERATOR)
    );
    const questions = parseAIResponse(aiResponse, "array");
    if (!questions) {
        return [
            { question: "Tell me about yourself and your experience.", questionType: "behavioral", difficulty: "easy" },
            { question: "What are your greatest strengths and weaknesses?", questionType: "behavioral", difficulty: "easy" },
        ];
    }
    return questions;
};

export const evaluateInterviewAnswer = async (interview, question, answer) => {
    if (USE_MOCK_AI) {
        return {
            feedback: {
                strengths: ["Good understanding of the topic", "Clear explanation"],
                weaknesses: ["Need more real-world examples"],
                communicationScore: 82,
                depthScore: 78,
                technicalAccuracy: 88,
                confidenceScore: 80,
                missingKeywords: ["Optimization", "Performance"],
                improvementTips: ["Explain concepts with practical examples.", "Mention best practices while answering."],
                suggestedAnswer: "A model answer would include ..."
            },
            score: 85,
        };
    }

    const prompt = generateInterviewPrompt(
        interview.role,
        interview.experience,
        interview.type,
        question.question,
        answer
    );

    const aiFeedback = await retryAIRequest(() =>
        generateAIResponse(prompt, SYSTEM_PROMPTS.INTERVIEW_EVALUATOR)
    );

    const feedback = parseAIResponse(aiFeedback);
    if (!feedback) {
        return {
            feedback: {
                strengths: ["Attempted to answer"],
                weaknesses: ["Could not analyze fully"],
                communicationScore: 50,
                technicalAccuracy: 50,
                depthScore: 50,
                confidenceScore: 50,
                improvementTips: ["Try to provide more detailed answers"],
                suggestedAnswer: "Not available"
            },
            score: 50,
        };
    }

    // Weighted composite score
    const technicalWeight = 0.4;
    const depthWeight = 0.25;
    const communicationWeight = 0.25;
    const confidenceWeight = 0.1;
    const score = Math.round(
        (feedback.technicalAccuracy || 0) * technicalWeight +
        (feedback.depthScore || 0) * depthWeight +
        (feedback.communicationScore || 0) * communicationWeight +
        (feedback.confidenceScore || 0) * confidenceWeight
    );

    return { feedback, score };
};

export const generateOverallFeedback = async (interview) => {
    const answeredQuestions = interview.questions.filter(q => q.userAnswer);
    if (answeredQuestions.length === 0) {
        return {
            totalScore: 0,
            overallFeedback: {
                overallScore: 0,
                strengths: [],
                weaknesses: [],
                communicationScore: 0,
                technicalAccuracy: 0,
                confidenceScore: 0,
                missingKeywords: [],
                improvementTips: [],
                detailedAnalysis: "No questions were answered.",
            },
        };
    }

    // Mock fallback
    if (USE_MOCK_AI) {
        const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length;
        const allStrengths = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.strengths || []))];
        const allWeaknesses = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.weaknesses || []))];
        const allMissing = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.missingKeywords || []))];
        const allTips = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.improvementTips || []))];
        return {
            totalScore: Math.round(totalScore),
            overallFeedback: {
                overallScore: Math.round(totalScore),
                strengths: allStrengths.slice(0, 5),
                weaknesses: allWeaknesses.slice(0, 5),
                communicationScore: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.communicationScore || 0), 0) / answeredQuestions.length),
                technicalAccuracy: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.technicalAccuracy || 0), 0) / answeredQuestions.length),
                confidenceScore: Math.round(totalScore),
                missingKeywords: allMissing,
                improvementTips: allTips,
                detailedAnalysis: "Interview completed.",
            },
        };
    }

    // Use AI to synthesise overall feedback
    const prompt = generateOverallInterviewPrompt(
        interview.role,
        interview.experience,
        interview.type,
        interview.questions
    );

    try {
        const aiResponse = await retryAIRequest(() =>
            generateAIResponse(prompt, SYSTEM_PROMPTS.INTERVIEW_EVALUATOR)
        );
        const feedback = parseAIResponse(aiResponse);
        if (feedback) {
            return {
                totalScore: feedback.overallScore || 0,
                overallFeedback: feedback,
            };
        }
    } catch (error) {
        console.error("AI overall feedback failed, falling back to aggregation", error);
    }

    // Fallback aggregation
    const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length;
    return {
        totalScore: Math.round(totalScore),
        overallFeedback: {
            overallScore: Math.round(totalScore),
            strengths: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.strengths || []))],
            weaknesses: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.weaknesses || []))],
            communicationScore: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.communicationScore || 0), 0) / answeredQuestions.length),
            technicalAccuracy: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.technicalAccuracy || 0), 0) / answeredQuestions.length),
            confidenceScore: Math.round(totalScore),
            missingKeywords: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.missingKeywords || []))],
            improvementTips: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.improvementTips || []))],
            detailedAnalysis: "Interview completed.",
        },
    };
};