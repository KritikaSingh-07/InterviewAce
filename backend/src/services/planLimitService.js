import Roadmap from '../models/Roadmap.js';
import MockInterview from '../models/MockInterview.js';
import { getPlanLimits } from '../config/plans.js';

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

const createLimitError = (message) => {
  const error = new Error(message);
  error.statusCode = 403;
  error.code = 'PLAN_LIMIT_REACHED';
  return error;
};

const computeRemaining = (limit, used) => {
  if (limit === null) return null;
  return Math.max(0, limit - used);
};

export const getMonthlyUsage = async (userId) => {
  const since = getStartOfMonth();

  const [roadmaps, interviews] = await Promise.all([
    Roadmap.countDocuments({ user: userId, createdAt: { $gte: since } }),
    MockInterview.countDocuments({ user: userId, createdAt: { $gte: since } }),
  ]);

  return { roadmaps, interviews, periodStart: since.toISOString() };
};

export const getPlanUsageSummary = async (user) => {
  const plan = user.plan || 'free';
  const limits = getPlanLimits(plan);
  const usage = await getMonthlyUsage(user._id);

  return {
    plan,
    limits: {
      roadmapsPerMonth: limits.roadmapsPerMonth,
      interviewsPerMonth: limits.interviewsPerMonth,
    },
    usage: {
      roadmaps: usage.roadmaps,
      interviews: usage.interviews,
    },
    remaining: {
      roadmaps: computeRemaining(limits.roadmapsPerMonth, usage.roadmaps),
      interviews: computeRemaining(limits.interviewsPerMonth, usage.interviews),
    },
    periodStart: usage.periodStart,
  };
};

export const assertCanCreateRoadmap = async (user) => {
  const plan = user.plan || 'free';
  const limits = getPlanLimits(plan);

  if (limits.roadmapsPerMonth === null) return;

  const { roadmaps } = await getMonthlyUsage(user._id);
  if (roadmaps >= limits.roadmapsPerMonth) {
    throw createLimitError(
      `Monthly roadmap limit reached (${limits.roadmapsPerMonth}). Upgrade your plan for more roadmaps.`
    );
  }
};

export const assertCanStartInterview = async (user) => {
  const plan = user.plan || 'free';
  const limits = getPlanLimits(plan);

  if (limits.interviewsPerMonth === null) return;

  const { interviews } = await getMonthlyUsage(user._id);
  if (interviews >= limits.interviewsPerMonth) {
    throw createLimitError(
      `Monthly mock interview limit reached (${limits.interviewsPerMonth}). Upgrade your plan for more interviews.`
    );
  }
};
