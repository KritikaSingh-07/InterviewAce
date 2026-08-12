import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { Plan } from '../../types';
import { PricingPlan } from '../../config/pricing';
import { useRazorpayCheckout, VerifyPaymentResponse } from '../../hooks/useRazorpayCheckout';
import { PaidPlan } from '../../config/planUpgrade';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: Plan;
  upgradeablePlans: PricingPlan[];
  onUpgradeSuccess?: (result: VerifyPaymentResponse) => void | Promise<void>;
}

export default function UpgradePlanModal({
  isOpen,
  onClose,
  currentPlan,
  upgradeablePlans,
  onUpgradeSuccess,
}: UpgradePlanModalProps) {
  const { startCheckout, isProcessing, processingPlan } = useRazorpayCheckout({
    requireAuth: true,
    redirectTo: false,
    onSuccess: async (result) => {
      onClose();
      await onUpgradeSuccess?.(result);
    },
  });

  const handleProceedToPay = async (planId: PaidPlan) => {
    await startCheckout(planId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={isProcessing ? undefined : onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131B2E] border border-gray-200 dark:border-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upgrade Your Plan</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Choose a plan — pricing matches our landing page tiers
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Plan cards */}
          <div className="p-6">
            {upgradeablePlans.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                You are already on the highest available plan.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upgradeablePlans.map((plan) => {
                  const isPopular = plan.popular;
                  const isLoading = isProcessing && processingPlan === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={[
                        'relative flex flex-col p-5 rounded-xl border',
                        isPopular
                          ? 'border-2 border-cyan-500 shadow-lg shadow-cyan-500/10'
                          : 'border-gray-200 dark:border-slate-800',
                      ].join(' ')}
                    >
                      {isPopular && (
                        <span className="absolute -top-2.5 right-4 bg-cyan-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-3 leading-relaxed">
                        {plan.subtitle}
                      </p>

                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                          {plan.price}
                        </span>
                        <span className="text-gray-500 dark:text-slate-400 text-sm">{plan.period}</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-300"
                          >
                            <Check className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" strokeWidth={3} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleProceedToPay(plan.id as PaidPlan)}
                        disabled={isProcessing}
                        className={[
                          'w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2',
                          isPopular
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            : 'border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800',
                          'disabled:opacity-60 disabled:cursor-not-allowed',
                        ].join(' ')}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Proceed to Pay
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-6 text-xs text-center text-gray-400 dark:text-slate-500">
              Current plan: <span className="capitalize font-medium">{currentPlan}</span>
              {' · '}
              Secure payment via Razorpay · Billed monthly
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
