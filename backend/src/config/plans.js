/**
 * Server-side plan pricing — never trust amounts from the frontend.
 * Amounts are in the smallest currency unit (paise for INR).
 */
export const PLAN_PRICING = {
  starter: {
    id: 'starter',
    name: 'Starter',
    amount: 290000, // ₹2,900 / month
    currency: 'INR',
    displayPrice: '$29',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    amount: 790000, // ₹7,900 / month
    currency: 'INR',
    displayPrice: '$79',
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    amount: 1990000, // ₹19,900 / month
    currency: 'INR',
    displayPrice: '$199',
  },
};

/** Monthly usage limits per plan (null = unlimited). */
export const PLAN_LIMITS = {
  free: {
    roadmapsPerMonth: 2,
    interviewsPerMonth: 3,
  },
  starter: {
    roadmapsPerMonth: 4,
    interviewsPerMonth: 5,
  },
  pro: {
    roadmapsPerMonth: 6,
    interviewsPerMonth: 10,
  },
  agency: {
    roadmapsPerMonth: null,
    interviewsPerMonth: null,
  },
};

export const PAID_PLANS = Object.keys(PLAN_PRICING);

export const getPlanConfig = (planId) => PLAN_PRICING[planId] ?? null;

export const getPlanLimits = (planId = 'free') =>
  PLAN_LIMITS[planId] ?? PLAN_LIMITS.free;

/** Plan tier ranking for upgrade validation (higher = better). */
export const PLAN_RANK = {
  free: 0,
  starter: 1,
  pro: 2,
  agency: 3,
};

export const isUpgrade = (currentPlan, targetPlan) =>
  (PLAN_RANK[targetPlan] ?? 0) > (PLAN_RANK[currentPlan ?? 'free'] ?? 0);
