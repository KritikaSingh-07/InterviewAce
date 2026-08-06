import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface PricingPlan {
  name: string;
  subtitle: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
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

interface PricingCardProps {
  plan: PricingPlan;
}

function PricingCard({ plan }: PricingCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isPopular = plan.popular;

  const handleClick = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={[
        'relative flex flex-col p-6 sm:p-8 rounded-xl',
        'bg-white dark:bg-[#131B2E]',
        'border',
        isPopular
          ? 'border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20'
          : 'border-gray-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors',
      ].join(' ')}
    >
      {isPopular && (
        <div className="absolute -top-3 right-6">
          <span className="bg-cyan-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full tracking-wide">
            Most Popular
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>

      {/* Subtitle */}
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">{plan.subtitle}</p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
        <span className="text-gray-500 dark:text-slate-400 text-sm font-normal">{plan.period}</span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-gray-600 dark:text-slate-300 text-sm">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-cyan-400" strokeWidth={3} />
            </span>
            <span className="font-bold text-gray-800 dark:text-slate-100">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={handleClick}
        className={
          isPopular
            ? 'w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors active:scale-[0.98]'
            : 'w-full py-3 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors active:scale-[0.98]'
        }
      >
        {plan.cta}
      </button>
    </motion.div>
  );
}

export default function PricingCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => (
        <PricingCard key={plan.name} plan={plan} />
      ))}
    </div>
  );
}
