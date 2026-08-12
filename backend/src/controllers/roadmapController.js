import Roadmap from '../models/Roadmap.js';
import Leaderboard from '../models/Leaderboard.js';
import { generateAIResponse } from '../config/ai.js';
<<<<<<< Updated upstream
import { SYSTEM_PROMPTS, generateRoadmapPrompt } from '../utils/aiPrompts.js';
=======
import { SYSTEM_PROMPTS, generateRoadmapPrompt, generatePracticeEvaluationPrompt } from '../utils/aiPrompts.js';
import { createNotification } from './notificationController.js';
>>>>>>> Stashed changes

// @desc    Generate new AI roadmap
// @route   POST /api/roadmaps/generate
// @access  Private
const generateRoadmap = async (req, res, next) => {
  try {
    const { targetRole, careerBio, skills, duration } = req.body;

    const prompt = generateRoadmapPrompt({
      targetRole,
      careerBio,
      skills,
      duration: duration || 4,
    });

<<<<<<< Updated upstream
    const aiResponse = await generateAIResponse(prompt, SYSTEM_PROMPTS.ROADMAP_GENERATOR);
=======
    // Helper: robustly extract JSON from AI text that may include markdown fences
    const extractJSON = (text) => {
      // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
      const fenceStripped = text
        .replace(/^```(?:json)?\s*/im, '')
        .replace(/\s*```\s*$/im, '')
        .trim();
>>>>>>> Stashed changes

      // 2. Try the fence-stripped version first
      try { return JSON.parse(fenceStripped); } catch (_) {}

      // 3. Try extracting the outermost { } block (greedy)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]); } catch (_) {}
      }

      // 4. Try extracting the LAST { } block (sometimes AI puts text before it)
      const allMatches = [...text.matchAll(/\{[\s\S]*?\}/g)];
      if (allMatches.length) {
        for (let i = allMatches.length - 1; i >= 0; i--) {
          try { return JSON.parse(allMatches[i][0]); } catch (_) {}
        }
      }

      return null;
    };

    let aiResponse = await generateAIResponse(prompt, SYSTEM_PROMPTS.ROADMAP_GENERATOR);
    console.log('[Roadmap] AI raw response length:', aiResponse?.length);

    let parsed = extractJSON(aiResponse);

    // Auto-retry once with a stricter JSON-only prompt if parsing failed
    if (!parsed) {
      console.warn('[Roadmap] First parse failed, retrying with JSON-strict prompt...');
      const retryPrompt = `${prompt}\n\nIMPORTANT: Return ONLY raw JSON with no markdown, no code fences, no extra text whatsoever. Start your response directly with { and end with }.`;
      aiResponse = await generateAIResponse(retryPrompt, SYSTEM_PROMPTS.ROADMAP_GENERATOR);
      parsed = extractJSON(aiResponse);
    }

    if (!parsed) {
      console.error('[Roadmap] Parse failed after retry. Response sample:', aiResponse?.slice(0, 300));
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    let totalTasks = 0;
    (parsed.weeklyStructure || []).forEach((week) => {
      totalTasks += week.days?.length || 0;
    });

    const roadmap = await Roadmap.create({
      user: req.user._id,
      targetRole,
      careerBio,
      durationWeeks: duration || 4,
      status: 'active',
      skillGapAnalysis: parsed.skillGapAnalysis || [],
      weeklyStructure: parsed.weeklyStructure || [],
      progress: {
        totalTasks,
        completedTasks: 0,
        percentage: 0,
      },
      aiGenerated: true,
      rawAiResponse: aiResponse,
    });

    res.status(201).json({ roadmap });

    createNotification({
      userId: req.user._id,
      type: 'roadmap_generated',
      title: 'Roadmap Ready!',
      message: `Your ${duration || 4}-week roadmap for ${targetRole} has been generated successfully.`,
      referenceId: roadmap._id,
      referenceModel: 'Roadmap',
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get user roadmaps
// @route   GET /api/roadmaps
// @access  Private
const getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id })
      .sort('-createdAt')
      .select('-rawAiResponse -weeklyStructure.days.practiceQuestions');

    res.json({ roadmaps });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single roadmap with full details
// @route   GET /api/roadmaps/:id
// @access  Private
const getRoadmapById = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    res.json({ roadmap });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark task as completed (manual fallback — kept for backwards compat)
// @route   PATCH /api/roadmaps/:id/tasks/:taskId/complete
// @access  Private
const completeTask = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    let taskFound = false;
    roadmap.weeklyStructure.forEach((week) => {
      week.days.forEach((day) => {
        if (day._id.toString() === req.params.taskId && !day.completed) {
          day.completed = true;
          day.completedAt = new Date();
          roadmap.progress.completedTasks += 1;
          taskFound = true;
        }
      });
    });

    if (!taskFound) {
      return res.status(404).json({ error: 'Task not found or already completed' });
    }

    roadmap.progress.percentage = Math.round(
      (roadmap.progress.completedTasks / roadmap.progress.totalTasks) * 100
    );

    let allWeeksCompleted = true;
    roadmap.weeklyStructure.forEach((week) => {
      const weekTasks = week.days.filter((d) => !d.completed);
      if (week.days.length > 0 && weekTasks.length === 0) {
        week.completed = true;
      } else {
        allWeeksCompleted = false;
      }
    });

    if (allWeeksCompleted) roadmap.status = 'completed';

    await roadmap.save();
    await awardRoadmapPoints(req.user._id, roadmap._id);

    res.json({ roadmap });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answer for a roadmap practice question
// @route   POST /api/roadmaps/:id/tasks/:taskId/questions/:questionId/answer
// @access  Private
const submitPracticeAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Find the day and question
    let targetDay = null;
    let targetQuestion = null;

    roadmap.weeklyStructure.forEach((week) => {
      week.days.forEach((day) => {
        if (day._id.toString() === req.params.taskId) {
          targetDay = day;
          day.practiceQuestions.forEach((q) => {
            if (q._id.toString() === req.params.questionId) {
              targetQuestion = q;
            }
          });
        }
      });
    });

    if (!targetDay)     return res.status(404).json({ error: 'Day not found' });
    if (!targetQuestion) return res.status(404).json({ error: 'Question not found' });
    if (targetQuestion.answered) return res.status(400).json({ error: 'Question already answered' });

    // AI evaluation
    const prompt = generatePracticeEvaluationPrompt({
      question: targetQuestion.question,
      answer: answer.trim(),
      type: targetQuestion.type,
      difficulty: targetQuestion.difficulty,
      targetRole: roadmap.targetRole,
    });

    let feedback = null;
    try {
      const aiResponse = await generateAIResponse(prompt, SYSTEM_PROMPTS.PRACTICE_EVALUATOR);
      console.log('[PracticeEval] Raw AI response:', aiResponse.slice(0, 300));
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
    } catch (parseErr) {
      console.error('[PracticeEval] Parse error:', parseErr.message);
      feedback = {
        score: 50,
        idealAnswer: 'The AI was unable to generate feedback at this time. Please try again.',
        explanation: 'Please review the topic and try again.',
        keyPoints: ['Review the fundamentals', 'Practice with examples'],
        diagram: '',
        strengthsInAnswer: [],
        improvementAreas: ['Could not evaluate answer'],
      };
    }

    const score = Math.min(100, Math.max(0, Math.round(feedback.score || 0)));

    // Persist answer + feedback
    targetQuestion.answered = true;
    targetQuestion.userAnswer = answer.trim();
    targetQuestion.score = score;
    targetQuestion.aiFeedback = {
      idealAnswer: feedback.idealAnswer || '',
      explanation: feedback.explanation || '',
      keyPoints: feedback.keyPoints || [],
      score,
    };

    // Score-based points
    const pointsEarned =
      score >= 80 ? 15 :
      score >= 60 ? 10 :
      score >= 40 ? 5  : 2;

    // Auto-complete day when all questions answered
    const allAnswered = targetDay.practiceQuestions.every((q) => q.answered);
    let dayAutoCompleted = false;

    if (allAnswered && !targetDay.completed) {
      targetDay.completed = true;
      targetDay.completedAt = new Date();
      roadmap.progress.completedTasks += 1;
      dayAutoCompleted = true;

      roadmap.progress.percentage = Math.round(
        (roadmap.progress.completedTasks / roadmap.progress.totalTasks) * 100
      );

      roadmap.weeklyStructure.forEach((week) => {
        const incomplete = week.days.filter((d) => !d.completed);
        if (week.days.length > 0 && incomplete.length === 0) week.completed = true;
      });

      const allWeeksCompleted = roadmap.weeklyStructure.every((w) => w.completed);
      if (allWeeksCompleted) roadmap.status = 'completed';
    }

    await roadmap.save();
    await awardPracticePoints(req.user._id, roadmap._id, pointsEarned, score);

    res.json({
      roadmap,
      feedback: {
        ...feedback,
        score,
        pointsEarned,
        dayAutoCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const awardRoadmapPoints = async (userId, roadmapId) => {
  try {
    let lb = await Leaderboard.findOne({ user: userId });
    if (!lb) lb = await Leaderboard.create({ user: userId });

    lb.totalPoints  += 10;
    lb.weeklyPoints += 10;
    lb.stats.tasksCompleted += 1;
    lb.pointsHistory.push({
      source: 'roadmap_task',
      points: 10,
      description: 'Completed a roadmap task',
      referenceId: roadmapId,
      referenceModel: 'Roadmap',
    });
    await lb.save();
  } catch (error) {
    console.error('Failed to award roadmap points:', error);
  }
};

const awardPracticePoints = async (userId, roadmapId, points, score) => {
  try {
    let lb = await Leaderboard.findOne({ user: userId });
    if (!lb) lb = await Leaderboard.create({ user: userId });

    lb.totalPoints  += points;
    lb.weeklyPoints += points;
    lb.pointsHistory.push({
      source: 'roadmap_question',
      points,
      description: `Answered practice question (score: ${score}/100)`,
      referenceId: roadmapId,
      referenceModel: 'Roadmap',
    });
    await lb.save();
  } catch (error) {
    console.error('Failed to award practice points:', error);
  }
};

export { generateRoadmap, getRoadmaps, getRoadmapById, completeTask, submitPracticeAnswer, polishBio, deleteRoadmap };

// @desc    Delete a roadmap
// @route   DELETE /api/roadmaps/:id
// @access  Private
const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    // Ensure the roadmap belongs to the requesting user
    if (roadmap.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this roadmap' });
    }
    await roadmap.deleteOne();
    return res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    return res.status(500).json({ error: 'Failed to delete roadmap' });
  }
};

// @desc    Polish career bio with AI
// @route   POST /api/roadmaps/polish-bio
// @access  Private
const polishBio = async (req, res) => {
  try {
    const { bio } = req.body;
    if (!bio || !bio.trim()) {
      return res.status(400).json({ error: 'Bio text is required' });
    }

    const systemPrompt = `You are an expert career coach and professional bio writer. 
Your task is to polish and improve a user's career bio/summary for job applications and interview prep platforms.
Make it concise, professional, impactful, and compelling.
Keep the same factual information but improve the language, structure, and tone.
Output ONLY the polished bio text — no explanations, no labels, no extra commentary.`;

    const prompt = `Polish this career bio into a professional, compelling summary (2-4 sentences max):

"${bio.trim()}"`;

    const polished = await generateAIResponse(prompt, systemPrompt);

    // Strip any quotes the AI might add around the result
    const cleaned = polished.trim().replace(/^["']|["']$/g, '');

    return res.json({ polished: cleaned });
  } catch (error) {
    console.error('Polish bio error:', error);
    return res.status(500).json({ error: 'Failed to polish bio. Please try again.' });
  }
};
