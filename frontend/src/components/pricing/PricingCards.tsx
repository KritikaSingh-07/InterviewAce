import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRICING_PLANS, PricingPlan, isPaidPlan } from '../../config/pricing';
import { useRazorpayCheckout } from '../../hooks/useRazorpayCheckout';
import { useAuthStore } from '../../store/authStore';

interface PricingCardProps {
  plan: PricingPlan;
  index: number;
}

function PricingCard({ plan, index }: PricingCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { startCheckout, isProcessing } = useRazorpayCheckout();
  const isPopular = plan.popular;

  const handleClick = async () => {
    if (plan.id === 'free') {
      navigate(isAuthenticated ? '/dashboard' : '/register');
      return;
    }

    if (isPaidPlan(plan.id)) {
      await startCheckout(plan.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="relative flex flex-col group h-full"
    >
      {/* Subtle Ambient Glow for Popular Plan */}
      {isPopular && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-300" />
      )}

      <div
        className={[
          'relative flex flex-col h-full p-4 sm:p-6 rounded-2xl transition-all duration-300',
          'bg-white/80 dark:bg-[#111726]/90 backdrop-blur-xl',
          'border',
          isPopular
            ? 'border-cyan-500/80 dark:border-cyan-400/80 shadow-xl shadow-cyan-500/10 dark:shadow-cyan-500/20'
            : 'border-gray-200/80 dark:border-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md',
        ].join(' ')}
      >
        {/* Most Popular Badge */}
        {isPopular && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md shadow-cyan-500/30 ring-1 ring-white/20">
              <Sparkles className="w-3 h-3 text-cyan-200 fill-cyan-200" />
              Most Popular
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {plan.name}
          </h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed min-h-[40px]">
            {plan.subtitle}
          </p>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800/80">
          <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {plan.price}
          </span>
          <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">
            {plan.period}
          </span>
        </div>

        {/* Features List */}
        <ul className="space-y-3.5 mb-8 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 flex items-center justify-center border border-cyan-500/20 dark:border-cyan-400/20">
                <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
              </span>
              <span className="text-gray-700 dark:text-slate-200 font-medium leading-snug">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={handleClick}
          disabled={isProcessing && isPaidPlan(plan.id)}
          className={[
            'w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200',
            'flex items-center justify-center gap-2 cursor-pointer',
            isPopular
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98]'
              : 'bg-gray-900 hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 border border-transparent dark:border-slate-700/50 hover:shadow-md active:scale-[0.98]',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
          ].join(' ')}
        >
          {isProcessing && isPaidPlan(plan.id) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing…</span>
            </>
          ) : (
            plan.cta
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function PricingCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch max-w-7xl mx-auto px-4 sm:px-6">
      {PRICING_PLANS.map((plan, index) => (
        <PricingCard key={plan.id} plan={plan} index={index} />
      ))}
    </div>
  );
}