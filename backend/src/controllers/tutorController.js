import TutorSession from '../models/TutorSession.js';
import Leaderboard from '../models/Leaderboard.js';
import CodingProblem from '../models/CodingProblem.js';
import ProblemSubmission from '../models/ProblemSubmission.js';
import {
  generateSocraticResponse,
  generateHint,
  generateSolution,
  generatePostSolutionResponse,
  executeCodeSimulated,
} from '../services/tutorService.js';

export const getProblemFilters = async (_req, res) => {
  try {
    const [topics, companies] = await Promise.all([
      CodingProblem.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: { topic: '$topic', difficulty: '$difficulty' }, count: { $sum: 1 } } },
        { $sort: { '_id.topic': 1 } },
      ]),
      CodingProblem.distinct('companies', { isPublished: true }),
    ]);
    const byTopic = Object.values(topics.reduce((result, row) => {
      const topic = row._id.topic;
      result[topic] ??= { topic, total: 0, difficulties: { Easy: 0, Medium: 0, Hard: 0 } };
      result[topic].difficulties[row._id.difficulty] = row.count;
      result[topic].total += row.count;
      return result;
    }, {}));
    const difficulties = ['Easy', 'Medium', 'Hard'].map((difficulty) => ({
      difficulty,
      total: byTopic.reduce((total, topic) => total + topic.difficulties[difficulty], 0),
    }));
    return res.json({ success: true, topics: byTopic, difficulties, companies: companies.sort() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Page coding problems server-side. The client never receives test cases.
 */
export const getProblems = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 20);
    const { topic, difficulty, company, status, search } = req.query;
    const filter = { isPublished: true };
    if (topic && topic !== 'All') filter.topic = topic;
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (company && company !== 'All') filter.companies = company;
    if (search?.trim()) filter.$text = { $search: search.trim() };

    // Status and bookmarks belong to the user, so identify matching problem ids first.
    if (status && status !== 'All') {
      const sessionFilter = { userId };
      if (status === 'Bookmarked') sessionFilter.isBookmarked = true;
      else sessionFilter.status = status === 'Not Started' ? { $in: ['attempted', 'solved'] } : status.toLowerCase();
      const ids = await TutorSession.find(sessionFilter).distinct('problemId');
      if (status === 'Not Started') filter.slug = { $nin: ids };
      else filter.slug = { $in: ids };
    }
    const [problems, total] = await Promise.all([
      CodingProblem.find(filter).select('-hiddenTestCases -solution -editorial').sort(search?.trim() ? { score: { $meta: 'textScore' } } : { title: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      CodingProblem.countDocuments(filter),
    ]);
    const userSessions = await TutorSession.find({ userId, problemId: { $in: problems.map((p) => p.slug) } }).select('problemId status isBookmarked').lean();
    const sessionMap = {};
    for (const s of userSessions) {
      sessionMap[s.problemId] = { status: s.status, isBookmarked: s.isBookmarked };
    }

    const problemsList = problems.map((p) => ({ ...p, id: p.slug, category: p.topic, companyTags: p.companies, ...(sessionMap[p.slug] || { status: 'not_started', isBookmarked: false }) }));
    return res.status(200).json({ success: true, problems: problemsList, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get coding problem by ID
 */
export const getProblemById = async (req, res) => {
  try {
    const problem = await CodingProblem.findOne({ slug: req.params.id, isPublished: true }).select('-hiddenTestCases -solution -editorial').lean();
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    return res.status(200).json({ success: true, problem: { ...problem, id: problem.slug, category: problem.topic, companyTags: problem.companies, templates: problem.starterCode } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get or create tutor session for a problem
 */
export const getSession = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user._id;

    const problem = await CodingProblem.findOne({ slug: problemId, isPublished: true }).select('+hiddenTestCases').lean();
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    let session = await TutorSession.findOne({ userId, problemId });

    if (!session) {
      // Create initial session
      const defaultLanguage = 'javascript';
      const defaultCode = problem.starterCode[defaultLanguage] || '';

      session = new TutorSession({
        userId,
        problemId,
        code: defaultCode,
        language: defaultLanguage,
        stage: 'socratic',
        hintLevel: 0,
        solutionUnlocked: false,
        messages: [
          {
            role: 'assistant',
            content: `Hi there! I am your AI coding tutor. Let's solve "${problem.title}" together.
I won't write the code for you, but I'll help you understand the concepts.

When you're ready to start, write down your thoughts or click **"I am stuck"** to begin our discussion!`,
            timestamp: new Date(),
          },
        ],
      });
      await session.save();
    }

    return res.status(200).json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Send chat message to tutor
 */
export const sendChatMessage = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { message, code, language } = req.body;
    const userId = req.user._id;

    const problem = await CodingProblem.findOne({ slug: problemId, isPublished: true }).select('+hiddenTestCases').lean();
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    let session = await TutorSession.findOne({ userId, problemId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found. Load the problem first.' });
    }

    // Update session current editor state
    if (code !== undefined) session.code = code;
    if (language !== undefined) session.language = language;

    // Append user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    let tutorReply = '';

    // Determine which generator to use based on current stage
    if (session.stage === 'socratic' || session.stage === 'hint') {
      // If student is answering or explaining their code
      tutorReply = await generateSocraticResponse(session, problem, session.code, session.language, message);
    } else {
      // post-solution mode
      tutorReply = await generatePostSolutionResponse(problem, session.code, session.language, session.messages, message);
    }

    // Append assistant message
    session.messages.push({
      role: 'assistant',
      content: tutorReply,
      timestamp: new Date(),
    });

    await session.save();

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Request next hint level
 */
export const unlockHint = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { code, language } = req.body;
    const userId = req.user._id;

    const problem = await CodingProblem.findOne({ slug: problemId, isPublished: true }).select('+hiddenTestCases').lean();
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    let session = await TutorSession.findOne({ userId, problemId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.solutionUnlocked) {
      return res.status(400).json({ error: 'Solution is already unlocked.' });
    }

    if (code !== undefined) session.code = code;
    if (language !== undefined) session.language = language;

    if (session.hintLevel >= 2) {
      // 3rd time: unlock the complete solution!
      session.solutionUnlocked = true;
      session.stage = 'post-solution';

      const solutionText = await generateSolution(problem, session.language);

      session.messages.push({
        role: 'assistant',
        content: solutionText,
        timestamp: new Date(),
      });

      await session.save();
      return res.status(200).json({ success: true, session });
    }

    // Increment hint level and unlock hint
    session.hintLevel += 1;
    if (session.stage === 'socratic') {
      session.stage = 'hint';
    }

    // Generate hint content
    const hintText = await generateHint(problem, session.code, session.language, session.hintLevel);

    // Append to messages history so it is logged
    session.messages.push({
      role: 'assistant',
      content: `💡 **Hint Level ${session.hintLevel}:** ${hintText}`,
      timestamp: new Date(),
    });

    await session.save();

    return res.status(200).json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Unlock complete solution
 */
export const unlockSolution = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language } = req.body;
    const userId = req.user._id;

    const problem = await CodingProblem.findOne({ slug: problemId, isPublished: true }).select('+hiddenTestCases').lean();
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    let session = await TutorSession.findOne({ userId, problemId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.solutionUnlocked = true;
    session.stage = 'post-solution'; // Shift to post-solution mentorship
    if (language) session.language = language;

    // Generate full detailed solution
    const solutionText = await generateSolution(problem, session.language);

    // Append to history
    session.messages.push({
      role: 'assistant',
      content: solutionText,
      timestamp: new Date(),
    });

    await session.save();

    return res.status(200).json({ success: true, session, solution: solutionText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Run/execute student code
 */
export const runCode = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    const problem = await CodingProblem.findOne({ slug: problemId, isPublished: true }).select('+hiddenTestCases').lean();
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const result = await executeCodeSimulated(problem, code, language);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Submit code — runs tests, marks problem solved, awards XP and updates streak
 */
export const submitCode = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { code, language } = req.body;
    const userId = req.user._id;

    const problem = await CodingProblem.findOne({ slug: problemId, isPublished: true }).select('+hiddenTestCases').lean();
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    let session = await TutorSession.findOne({ userId, problemId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Run simulated code evaluation
    const result = await executeCodeSimulated(problem, code, language);
    const allPassed = result.results && result.results.every((r) => r.passed) && !result.error;

    // Update session state. XP is only awarded for a user's first successful solve.
    const wasSolved = session.status === 'solved';
    session.code = code;
    session.language = language;
    if (session.status !== 'solved') {
      session.status = allPassed ? 'solved' : 'attempted';
    }
    if (allPassed && !session.submittedAt) {
      session.submittedAt = new Date();
    }

    // Automatically transition to post-solution stage & unlock solution if solved
    if (allPassed && !session.solutionUnlocked) {
      session.solutionUnlocked = true;
      session.stage = 'post-solution';
      try {
        const solutionText = await generateSolution(problem, session.language);
        session.messages.push({
          role: 'assistant',
          content: solutionText,
          timestamp: new Date(),
        });
      } catch (solErr) {
        console.error('Failed to generate solution on submit:', solErr);
      }
    }
    await session.save();
    await ProblemSubmission.create({
      userId,
      problemSlug: problemId,
      language,
      code,
      passed: allPassed,
      testsPassed: result.results?.filter((test) => test.passed).length || 0,
      testsTotal: result.results?.length || 0,
    });

    // Award XP and update streak if solved for the first time
    let xpAwarded = 0;
    if (allPassed && !wasSolved) {
      const xp = problem.xpReward || 50;
      xpAwarded = xp;
      try {
        let lb = await Leaderboard.findOne({ user: userId });
        if (!lb) {
          lb = new Leaderboard({ user: userId, totalPoints: 0, pointsHistory: [], streak: { current: 0, longest: 0 } });
        }
        // Add XP to history
        lb.pointsHistory.push({ points: xp, source: 'coding_tutor', description: `Solved: ${problem.title}` });
        lb.totalPoints = (lb.totalPoints || 0) + xp;

        // Update streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = lb.streak?.lastActive ? new Date(lb.streak.lastActive) : null;
        if (lastActive) {
          lastActive.setHours(0, 0, 0, 0);
          const diffDays = Math.round((today - lastActive) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            lb.streak.current = (lb.streak.current || 0) + 1;
          } else if (diffDays > 1) {
            lb.streak.current = 1;
          }
        } else {
          lb.streak.current = 1;
        }
        lb.streak.lastActive = new Date();
        lb.streak.longest = Math.max(lb.streak.longest || 0, lb.streak.current || 0);
        await lb.save();
      } catch (lbErr) {
        console.error('Leaderboard update error:', lbErr);
      }
    }

    return res.status(200).json({
      success: true,
      allPassed,
      xpAwarded,
      session,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Toggle bookmark status for a problem
 */
export const toggleBookmark = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user._id;

    const problem = await CodingProblem.findOne({ slug: problemId, isPublished: true }).select('+hiddenTestCases').lean();
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    let session = await TutorSession.findOne({ userId, problemId });
    if (!session) {
      // Create a minimal session if none exists yet
      session = new TutorSession({
        userId,
        problemId,
        code: problem.starterCode?.javascript || '',
        language: 'javascript',
        messages: [],
      });
    }

    session.isBookmarked = !session.isBookmarked;
    await session.save();

    return res.status(200).json({ success: true, isBookmarked: session.isBookmarked });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
