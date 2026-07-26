import Roadmap from '../models/Roadmap.js';
import Leaderboard from '../models/Leaderboard.js';
import { generateAIResponse } from '../config/ai.js';
import { SYSTEM_PROMPTS, generateRoadmapPrompt } from '../utils/aiPrompts.js';

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

    const aiResponse = await generateAIResponse(prompt, SYSTEM_PROMPTS.ROADMAP_GENERATOR);

    let parsed;
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    // Calculate total tasks
    let totalTasks = 0;
    parsed.weeklyStructure.forEach((week) => {
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

// @desc    Mark task as completed
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

    // Find and update the task
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

    // Update percentage
    roadmap.progress.percentage = Math.round(
      (roadmap.progress.completedTasks / roadmap.progress.totalTasks) * 100
    );

    // Check if all weeks completed
    let allWeeksCompleted = true;
    roadmap.weeklyStructure.forEach((week) => {
      const weekTasks = week.days.filter((d) => !d.completed);
      if (week.days.length > 0 && weekTasks.length === 0) {
        week.completed = true;
      } else {
        allWeeksCompleted = false;
      }
    });

    if (allWeeksCompleted) {
      roadmap.status = 'completed';
    }

    await roadmap.save();

    // Award leaderboard points
    await awardRoadmapPoints(req.user._id, roadmap._id);

    res.json({ roadmap });
  } catch (error) {
    next(error);
  }
};

// Helper: Award points for roadmap tasks
const awardRoadmapPoints = async (userId, roadmapId) => {
  try {
    let leaderboard = await Leaderboard.findOne({ user: userId });
    if (!leaderboard) {
      leaderboard = await Leaderboard.create({ user: userId });
    }

    leaderboard.totalPoints += 10;
    leaderboard.weeklyPoints += 10;
    leaderboard.stats.tasksCompleted += 1;

    leaderboard.pointsHistory.push({
      source: 'roadmap_task',
      points: 10,
      description: 'Completed a roadmap task',
      referenceId: roadmapId,
      referenceModel: 'Roadmap',
    });

    await leaderboard.save();
  } catch (error) {
    console.error('Failed to award points:', error);
  }
};

export { generateRoadmap, getRoadmaps, getRoadmapById, completeTask };

