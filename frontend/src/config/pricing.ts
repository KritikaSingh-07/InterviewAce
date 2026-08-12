import { Plan } from '../types';

export type PaidPlan = Exclude<Plan, 'free'>;

export interface PricingPlan {
  id: Plan;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Try AI career tools for free',
    price: '$0',
    period: '/ Month',
    features: [
      '2 AI Roadmaps/ Month',
      '3 AI Mock Interviews/ Month',
      'Fast & Instant Feedback',
      'Standard Interview Question Bank',
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'The perfect start for regular interview preparation',
    price: '$29',
    period: '/ Month',
    features: [
      '4 Personalized Roadmaps/ Month',
      '5 AI Mock Interviews/ Month',
      'Role-Specific Questioning',
      'Ultra-Low Latency Voice Practice',
    ],
    cta: 'Choose Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'For serious job seekers and professional growth',
    price: '$79',
    period: '/ Month',
    features: [
      '6 Personalized Roadmaps/ Month',
      '10 AI Mock Interviews/ Month',
      'High-Reasoning AI Feedback (Claude Sonnet)',
      'Grammar, Tone & Technical Accuracy Score',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    subtitle: 'For coaching, institutes, and real-world mentorship',
    price: '$199',
    period: '/ Month',
    features: [
      'Bulk AI Roadmaps Access',
      'Bulk AI Mock Interviews Access',
      'Real-World Mentor Connect',
      'Live Expert Feedback & Guidance',
    ],
    cta: 'Get Agency Access',
  },
];

export const PAID_PLAN_IDS: PaidPlan[] = ['starter', 'pro', 'agency'];

export const isPaidPlan = (planId: Plan): planId is PaidPlan =>
  PAID_PLAN_IDS.includes(planId as PaidPlan);
