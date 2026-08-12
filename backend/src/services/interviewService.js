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
    let questions = [];
    if (value.includes("react")) questions = MOCK_QUESTIONS.react;
    else if (value.includes("javascript")) questions = MOCK_QUESTIONS.javascript;
    else if (value.includes("node")) questions = MOCK_QUESTIONS.node;
    else if (value.includes("java")) questions = MOCK_QUESTIONS.java;
    else if (value.includes("python")) questions = MOCK_QUESTIONS.python;
    else if (value.includes("php")) questions = MOCK_QUESTIONS.php;
    else questions = MOCK_QUESTIONS.generic;
    // Ensure maxScore is set based on difficulty for mock data (if not already)
    return questions.map(q => ({
        ...q,
        maxScore: q.maxScore || DIFFICULTY_MAX_SCORES[q.difficulty] || 100,
    }));
}

// --------------------------------------------------------------------
// Difficulty → Max Score Mapping
// --------------------------------------------------------------------
const DIFFICULTY_MAX_SCORES = {
    easy: 50,
    medium: 75,
    hard: 100,
};

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
        if (jaccard > 0.7) return true;
    }
    return false;
}

export const calculateNextDifficulty = (currentDifficulty, recentScores, timeUsedPercent) => {
    if (!recentScores.length) return 'easy';
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const consistency = recentScores.length > 1
        ? 1 - (Math.max(...recentScores) - Math.min(...recentScores)) / 100
        : 0.5;
    const timePressure = timeUsedPercent > 0.8 ? 0.8 : 1.0;
    if (avg >= 85 && consistency > 0.7) return 'hard';
    if (avg >= 70) return 'medium';
    if (avg >= 40) return 'easy';
    return 'easy';
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
    let question;
    if (USE_MOCK_AI) {
        const mockQuestions = getMockQuestions(role);
        const idx = previousQuestions.length;
        question = mockQuestions[idx] || {
            question: `Explain one challenging ${role} project you have worked on.`,
            questionType: "behavioral",
            difficulty: currentDifficulty,
        };
    } else {
        let prompt = generateNextInterviewQuestionPrompt({
            role,
            experience,
            interviewType,
            previousQuestions,
            currentDifficulty,
        });

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
            question = {
                question: "Tell me about a challenging technical decision you made recently.",
                questionType: "behavioral",
                difficulty: currentDifficulty,
            };
        }
    }

    question.maxScore = DIFFICULTY_MAX_SCORES[question.difficulty] || 100;
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
    return questions.map(q => ({
        ...q,
        maxScore: DIFFICULTY_MAX_SCORES[q.difficulty] || 100,
    }));
};

export const evaluateInterviewAnswer = async (interview, question, answer) => {
    let feedback, rawScore;
    if (USE_MOCK_AI) {
        feedback = {
            strengths: ["Good understanding of the topic", "Clear explanation"],
            weaknesses: ["Need more real-world examples"],
            communicationScore: 82,
            depthScore: 78,
            technicalAccuracy: 88,
            confidenceScore: 80,
            missingKeywords: ["Optimization", "Performance"],
            improvementTips: ["Explain concepts with practical examples.", "Mention best practices while answering."],
            suggestedAnswer: "A model answer would include ..."
        };
        rawScore = 85;
    } else {
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

        feedback = parseAIResponse(aiFeedback);
        if (!feedback) {
            feedback = {
                strengths: ["Attempted to answer"],
                weaknesses: ["Could not analyze fully"],
                communicationScore: 50,
                technicalAccuracy: 50,
                depthScore: 50,
                confidenceScore: 50,
                improvementTips: ["Try to provide more detailed answers"],
                suggestedAnswer: "Not available"
            };
            rawScore = 50;
        } else {
            const technicalWeight = 0.4;
            const depthWeight = 0.25;
            const communicationWeight = 0.25;
            const confidenceWeight = 0.1;
            rawScore = Math.round(
                (feedback.technicalAccuracy || 0) * technicalWeight +
                (feedback.depthScore || 0) * depthWeight +
                (feedback.communicationScore || 0) * communicationWeight +
                (feedback.confidenceScore || 0) * confidenceWeight
            );
        }
    }

    const maxScore = question.maxScore || 100;
    const scaledScore = Math.round((rawScore / 100) * maxScore);
    return { feedback, score: scaledScore };
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

    // Correct weighted overall score: sum(scores) / sum(maxScores) * 100
    const totalScores = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
    const totalMaxScores = answeredQuestions.reduce((sum, q) => sum + (q.maxScore || 100), 0);
    const overallScore = Math.min(100, Math.round((totalScores / totalMaxScores) * 100));

    // Mock fallback
    if (USE_MOCK_AI) {
        const allStrengths = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.strengths || []))];
        const allWeaknesses = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.weaknesses || []))];
        const allMissing = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.missingKeywords || []))];
        const allTips = [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.improvementTips || []))];
        return {
            totalScore: overallScore,
            overallFeedback: {
                overallScore,
                strengths: allStrengths.slice(0, 5),
                weaknesses: allWeaknesses.slice(0, 5),
                communicationScore: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.communicationScore || 0), 0) / answeredQuestions.length),
                technicalAccuracy: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.technicalAccuracy || 0), 0) / answeredQuestions.length),
                confidenceScore: Math.round(overallScore),
                missingKeywords: allMissing,
                improvementTips: allTips,
                detailedAnalysis: "Interview completed.",
            },
        };
    }

    // AI synthesis
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
            // Override AI's overallScore with our calculated weighted one (keep it ≤100)
            feedback.overallScore = overallScore;
            return {
                totalScore: overallScore,
                overallFeedback: feedback,
            };
        }
    } catch (error) {
        console.error("AI overall feedback failed, falling back to aggregation", error);
    }

    // Fallback aggregation
    return {
        totalScore: overallScore,
        overallFeedback: {
            overallScore,
            strengths: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.strengths || []))],
            weaknesses: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.weaknesses || []))],
            communicationScore: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.communicationScore || 0), 0) / answeredQuestions.length),
            technicalAccuracy: Math.round(answeredQuestions.reduce((s, q) => s + (q.aiFeedback?.technicalAccuracy || 0), 0) / answeredQuestions.length),
            confidenceScore: Math.round(overallScore),
            missingKeywords: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.missingKeywords || []))],
            improvementTips: [...new Set(answeredQuestions.flatMap(q => q.aiFeedback?.improvementTips || []))],
            detailedAnalysis: "Interview completed.",
        },
    };
};