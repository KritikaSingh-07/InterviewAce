import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { Plan } from '../../types';
import { PricingPlan } from '../../config/pricing';
import { useRazorpayCheckout, VerifyPaymentResponse } from '../../hooks/useRazorpayCheckout';
import { PaidPlan } from '../../config/planUpgrade';
import Modal from '../ui/Modal';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Your Plan"
      description="Choose a plan — pricing matches our landing page tiers"
      maxWidth="max-w-4xl"
      closeOnBackdropClick={!isProcessing}
      showCloseButton={!isProcessing}
    >
      {/* Plan cards */}
      <div className="p-1">
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
                      ? 'border-2 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'border-gray-200 dark:border-slate-800',
                  ].join(' ')}
                >
                  {isPopular && (
                    <span className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-3 leading-relaxed">
                    {plan.subtitle}
                  </p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                      /mo
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-350">
                        <Check className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleProceedToPay(plan.id as PaidPlan)}
                    disabled={isProcessing}
                    className={[
                      'w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2',
                      isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
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
    </Modal>
  );
}
