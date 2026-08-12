import { Plan } from '../types';
import { PRICING_PLANS, PricingPlan, isPaidPlan, PaidPlan } from '../config/pricing';

/** Plan tier ranking — must stay in sync with backend PLAN_RANK. */
export const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  agency: 3,
};

/** Paid plans the user can upgrade to from their current plan. */
export const getUpgradeablePlans = (currentPlan: Plan = 'free'): PricingPlan[] =>
  PRICING_PLANS.filter(
    (plan) => isPaidPlan(plan.id) && PLAN_RANK[plan.id] > PLAN_RANK[currentPlan]
  );

export const canUpgrade = (currentPlan: Plan): boolean =>
  getUpgradeablePlans(currentPlan).length > 0;

export type { PaidPlan, PricingPlan };
