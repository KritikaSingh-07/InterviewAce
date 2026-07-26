import MockInterview from '../models/MockInterview.js';
import Leaderboard from '../models/Leaderboard.js';
import { generateAIResponse } from '../config/ai.js';
import {
  SYSTEM_PROMPTS,
  generateInterviewPrompt,
} from '../utils/aiPrompts.js';

// @desc    Start a new mock interview
// @route   POST /api/interviews/start
// @access  Private
const startInterview = async (req, res, next) => {
  try {
    const { role, experience, type, duration } = req.body;

    // Generate initial questions using AI
    const prompt = `Generate 5 ${type} interview questions for a ${experience}-level ${role} position. Return as JSON array with fields: question, questionType, difficulty.`;

    const aiResponse = await generateAIResponse(
      prompt,
      SYSTEM_PROMPTS.INTERVIEW_QUESTION_GENERATOR
    );

    let questions;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      questions = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(aiResponse);
    } catch {
      questions = [
        { question: 'Tell me about yourself and your experience.', questionType: 'behavioral', difficulty: 'easy' },
        { question: 'What are your greatest strengths and weaknesses?', questionType: 'behavioral', difficulty: 'easy' },
      ];
    }

    const interview = await MockInterview.create({
      user: req.user._id,
      role,
      experience,
      type,
      duration: duration || 30,
      status: 'in-progress',
      questions: questions.map((q) => ({
        question: q.question,
        questionType: q.questionType || type,
      })),
    });

    res.status(201).json({ interview });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answer for a question
// @route   POST /api/interviews/:id/question/:questionId/answer
// @access  Private
const submitAnswer = async (req, res, next) => {
  try {
    const { answer, duration } = req.body;
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const question = interview.questions.id(req.params.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.userAnswer = answer;
    question.duration = duration || 0;

    // Evaluate answer with AI
    const prompt = generateInterviewPrompt(
      interview.role,
      interview.experience,
      interview.type,
      question.question,
      answer
    );

    const aiFeedback = await generateAIResponse(
      prompt,
      SYSTEM_PROMPTS.INTERVIEW_EVALUATOR
    );

    try {
      const jsonMatch = aiFeedback.match(/\{[\s\S]*\}/);
      const feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiFeedback);

      question.aiFeedback = feedback;
      question.score = Math.round(
        (feedback.communicationScore + feedback.technicalAccuracy) / 2
      );
    } catch {
      question.aiFeedback = {
        strengths: ['Attempted to answer'],
        weaknesses: ['Could not analyze fully'],
        communicationScore: 50,
        technicalAccuracy: 50,
        improvementTips: ['Try to provide more detailed answers'],
      };
      question.score = 50;
    }

    await interview.save();

    res.json({ question });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete interview and get overall feedback
// @route   POST /api/interviews/:id/complete
// @access  Private
const completeInterview = async (req, res, next) => {
  try {
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.status = 'completed';

    // Calculate overall scores
    const answeredQuestions = interview.questions.filter((q) => q.userAnswer);
    const totalScore =
      answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) /
      (answeredQuestions.length || 1);

    const avgCommunication =
      answeredQuestions.reduce(
        (sum, q) => sum + (q.aiFeedback?.communicationScore || 0),
        0
      ) / (answeredQuestions.length || 1);

    const avgTechnical =
      answeredQuestions.reduce(
        (sum, q) => sum + (q.aiFeedback?.technicalAccuracy || 0),
        0
      ) / (answeredQuestions.length || 1);

    // Collect all feedback
    const allStrengths = answeredQuestions.flatMap(
      (q) => q.aiFeedback?.strengths || []
    );
    const allWeaknesses = answeredQuestions.flatMap(
      (q) => q.aiFeedback?.weaknesses || []
    );
    const allMissingKeywords = answeredQuestions.flatMap(
      (q) => q.aiFeedback?.missingKeywords || []
    );
    const allTips = answeredQuestions.flatMap(
      (q) => q.aiFeedback?.improvementTips || []
    );

    interview.overallFeedback = {
      overallScore: Math.round(totalScore),
      strengths: [...new Set(allStrengths)],
      weaknesses: [...new Set(allWeaknesses)],
      communicationScore: Math.round(avgCommunication),
      technicalAccuracy: Math.round(avgTechnical),
      confidenceScore: Math.round(totalScore),
      missingKeywords: [...new Set(allMissingKeywords)],
      improvementTips: [...new Set(allTips)],
      detailedAnalysis: `Completed ${answeredQuestions.length} out of ${interview.questions.length} questions. Overall performance: ${Math.round(totalScore)}/100.`,
    };

    interview.totalScore = Math.round(totalScore);
    interview.aiAnalysisComplete = true;

    await interview.save();

    // Award leaderboard points
    await awardInterviewPoints(req.user._id, interview._id, totalScore);

    res.json({ interview });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's interview history
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res, next) => {
  try {
    const interviews = await MockInterview.find({ user: req.user._id })
      .sort('-createdAt')
      .select('-questions.userAnswer -overallFeedback.detailedAnalysis');
    res.json({ interviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview with full details
// @route   GET /api/interviews/:id
// @access  Private
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    next(error);
  }
};

// Helper: Award points for completing interviews
const awardInterviewPoints = async (userId, interviewId, score) => {
  try {
    let leaderboard = await Leaderboard.findOne({ user: userId });
    if (!leaderboard) {
      leaderboard = await Leaderboard.create({ user: userId });
    }

    const pointsAwarded = Math.round(score * 1.5); // Score-based points
    leaderboard.totalPoints += pointsAwarded;
    leaderboard.weeklyPoints += pointsAwarded;
    leaderboard.stats.interviewsCompleted += 1;
    leaderboard.stats.averageScore =
      (leaderboard.stats.averageScore * (leaderboard.stats.interviewsCompleted - 1) + score) /
      leaderboard.stats.interviewsCompleted;

    leaderboard.pointsHistory.push({
      source: 'mock_interview',
      points: pointsAwarded,
      description: `Completed mock interview with score ${Math.round(score)}`,
      referenceId: interviewId,
      referenceModel: 'MockInterview',
    });

    await leaderboard.save();
  } catch (error) {
    console.error('Failed to award interview points:', error);
  }
};

export {
  startInterview,
  submitAnswer,
  completeInterview,
  getInterviews,
  getInterviewById,
};

