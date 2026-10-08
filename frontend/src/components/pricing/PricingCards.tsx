import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
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
      initial={{ opacity: 0, y: 48, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10 }}
      className={[
        'group relative rounded-xl will-change-transform',
        // Popular plan gets a 1.5px frame with a light travelling around it
        isPopular ? 'p-[1.5px] overflow-hidden shadow-2xl shadow-indigo-900/25 dark:shadow-violet-900/30' : '',
      ].join(' ')}
    >
      {isPopular && (
        <div
          aria-hidden
          className="absolute inset-[-60%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,rgb(var(--brand-1))_0deg,rgb(var(--brand-1))_200deg,rgb(var(--brand-2))_290deg,#f5f8f6_330deg,rgb(var(--brand-1))_360deg)]"
        />
      )}
      <div
        className={[
          'relative h-full flex flex-col p-6 sm:p-8 rounded-[calc(0.75rem-1px)]',
          'bg-white dark:bg-gray-900 transition-shadow duration-300',
          isPopular
            ? ''
            : 'border border-gray-200 dark:border-gray-800 group-hover:border-indigo-300 dark:group-hover:border-violet-500/40 group-hover:shadow-xl group-hover:shadow-indigo-900/10',
        ].join(' ')}
      >
        {isPopular && (
          <div className="absolute -top-px right-6">
            <span className="inline-block bg-indigo-900 dark:bg-violet-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-b-lg tracking-[0.15em]">
              Most Popular
            </span>
          </div>
        )}

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>

        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{plan.subtitle}</p>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-bold font-display text-gray-900 dark:text-white">{plan.price}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">{plan.period}</span>
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature, i) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 text-gray-600 dark:text-gray-300 text-sm"
            >
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-900/10 dark:bg-violet-500/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Check className="w-3.5 h-3.5 text-indigo-800 dark:text-violet-400" strokeWidth={3} />
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{feature}</span>
            </motion.li>
          ))}
        </ul>

        <button
          onClick={handleClick}
          disabled={isProcessing && isPaidPlan(plan.id)}
          className={[
            isPopular
              ? 'btn-primary w-full !py-3 !rounded-lg'
              : 'w-full py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-semibold transition-all duration-300 hover:bg-gray-950 hover:text-white hover:border-gray-950 dark:hover:bg-white dark:hover:text-gray-950 dark:hover:border-white active:scale-[0.98]',
            'disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
          ].join(' ')}
        >
          {isProcessing && isPaidPlan(plan.id) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing…
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {PRICING_PLANS.map((plan, index) => (
        <PricingCard key={plan.id} plan={plan} index={index} />
      ))}
    </div>
  );
}
