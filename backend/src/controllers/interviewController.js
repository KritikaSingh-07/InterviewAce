import MockInterview from "../models/MockInterview.js";
import Leaderboard from "../models/Leaderboard.js";
import {
  generateNextQuestion,
  evaluateInterviewAnswer,
  generateOverallFeedback,
  calculateNextDifficulty,
} from "../services/interviewService.js";
import { assertCanStartInterview } from "../services/planLimitService.js";

// ======================================================
// @desc Start Interview
// @route POST /api/interviews/start
// ======================================================
const startInterview = async (req, res, next) => {
  try {
    await assertCanStartInterview(req.user);

    const { role, experience, type, duration } = req.body;

    const interviewDuration = duration || 10;
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + interviewDuration * 60 * 1000
    );

    const firstQuestion = await generateNextQuestion({
      role,
      experience,
      interviewType: type,
      previousQuestions: [],
      currentDifficulty: "easy",
    });

    const interview = await MockInterview.create({
      user: req.user._id,
      role,
      experience,
      type,
      duration: interviewDuration,
      status: "in-progress",
      startedAt,
      expiresAt,
      currentDifficulty: "easy",
      totalQuestionsAsked: 1,
      questions: [
        {
          question: firstQuestion.question,
          questionType: firstQuestion.questionType,
          difficulty: firstQuestion.difficulty,
          questionNumber: 1,
        },
      ],
    });

    return res.status(201).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// @desc Submit Answer
// @route POST /api/interviews/:id/question/:questionId/answer
// ======================================================
const submitAnswer = async (req, res, next) => {
  try {
    const { answer, duration } = req.body;
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview already completed.",
      });
    }

    const question = interview.questions.id(req.params.questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (question.status === "answered") {
      return res.status(400).json({
        success: false,
        message: "Question already answered.",
      });
    }

    question.userAnswer = answer;
    question.duration = duration || 0;
    question.status = "answered";
    question.answeredAt = new Date();

    // ===============================
    // Evaluate Current Answer
    // ===============================
    const evaluation = await evaluateInterviewAnswer(
      interview,
      question,
      answer
    );
    question.aiFeedback = evaluation.feedback;
    question.score = evaluation.score;

    // ===============================
    // Adaptive Difficulty
    // ===============================
    const recentScores = interview.questions
      .filter((q) => q.status === "answered")
      .slice(-3)
      .map((q) => q.score || 0);
    const elapsedMinutes =
      (Date.now() - interview.startedAt.getTime()) / 60000;
    const timeUsedPercent = elapsedMinutes / interview.duration;
    interview.currentDifficulty = calculateNextDifficulty(
      interview.currentDifficulty,
      recentScores,
      timeUsedPercent
    );

    // ===============================
    // Remaining Time
    // ===============================
    const remainingMinutes = interview.duration - elapsedMinutes;

    // ===============================
    // Timer Finished
    // ===============================
    if (remainingMinutes <= 0) {
      interview.status = "completed";
      interview.completedAt = new Date();
      const report = await generateOverallFeedback(interview);
      interview.overallFeedback = report.overallFeedback;
      interview.totalScore = report.totalScore;
      interview.aiAnalysisComplete = true;
      await interview.save();
      await awardInterviewPoints(
        req.user._id,
        interview._id,
        interview.totalScore
      );

      return res.json({
        success: true,
        interviewCompleted: true,
        interview,
      });
    }

    // ===============================
    // Generate Next Question
    // ===============================
    const nextQuestion = await generateNextQuestion({
      role: interview.role,
      experience: interview.experience,
      interviewType: interview.type,
      previousQuestions: interview.questions,
      currentDifficulty: interview.currentDifficulty,
    });

    interview.questions.push({
      question: nextQuestion.question,
      questionType: nextQuestion.questionType,
      difficulty: nextQuestion.difficulty,
      questionNumber: interview.totalQuestionsAsked + 1,
      expectedConcepts: nextQuestion.expectedConcepts || [],
    });

    interview.totalQuestionsAsked += 1;
    await interview.save();

    return res.json({
      success: true,
      interviewCompleted: false,
      nextQuestion: interview.questions.at(-1),
      progress: {
        answered: interview.questions.filter(
          (q) => q.status === "answered"
        ).length,
        remainingTime: Math.max(0, Math.floor(remainingMinutes)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// @desc Complete Interview
// @route POST /api/interviews/:id/complete
// ======================================================
const completeInterview = async (req, res, next) => {
  try {
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status === "completed") {
      return res.json({
        success: true,
        interview,
      });
    }

    interview.status = "completed";
    interview.completedAt = new Date();

    const report = await generateOverallFeedback(interview);
    interview.overallFeedback = report.overallFeedback;
    interview.totalScore = report.totalScore;
    interview.aiAnalysisComplete = true;

    await interview.save();

    await awardInterviewPoints(
      req.user._id,
      interview._id,
      interview.totalScore
    );

    return res.json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// @desc Get All Interviews
// @route GET /api/interviews
// ======================================================
const getInterviews = async (req, res, next) => {
  try {
    const interviews = await MockInterview.find({
      user: req.user._id,
    })
      .sort("-createdAt")
      .select("-questions.userAnswer");

    res.json({
      success: true,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// @desc Get Single Interview
// @route GET /api/interviews/:id
// ======================================================
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (
      interview.status === "in-progress" &&
      interview.expiresAt &&
      new Date() >= new Date(interview.expiresAt)
    ) {
      interview.status = "completed";
      interview.completedAt = new Date();

      if (!interview.aiAnalysisComplete) {
        const report = await generateOverallFeedback(interview);
        interview.overallFeedback = report.overallFeedback;
        interview.totalScore = report.totalScore;
        interview.aiAnalysisComplete = true;
      }

      await interview.save();
    }

    return res.json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Helper: Award Leaderboard Points
// ======================================================
const awardInterviewPoints = async (userId, interviewId, score) => {
  try {
    let leaderboard = await Leaderboard.findOne({ user: userId });
    if (!leaderboard) {
      leaderboard = await Leaderboard.create({ user: userId });
    }
    const points = Math.round(score * 1.5);
    leaderboard.totalPoints += points;
    leaderboard.weeklyPoints += points;
    leaderboard.stats.interviewsCompleted += 1;
    leaderboard.stats.averageScore =
      ((leaderboard.stats.averageScore *
        (leaderboard.stats.interviewsCompleted - 1)) +
        score) /
      leaderboard.stats.interviewsCompleted;
    leaderboard.pointsHistory.push({
      source: "mock_interview",
      points,
      description: `Completed interview (${Math.round(score)})`,
      referenceId: interviewId,
      referenceModel: "MockInterview",
    });
    await leaderboard.save();
  } catch (error) {
    console.error("Leaderboard update error:", error);
  }
};

export {
  startInterview,
  submitAnswer,
  completeInterview,
  getInterviews,
  getInterviewById,
};