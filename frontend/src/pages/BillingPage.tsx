import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Loader2,
  ArrowUpRight,
  Receipt,
  Route,
  BotMessageSquare,
  CalendarDays,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { usePlanUsage, formatUsageLabel } from '../hooks/usePlanUsage';
import { VerifyPaymentResponse } from '../hooks/useRazorpayCheckout';
import { PaymentRecord, Plan } from '../types';
import UpgradePlanModal from '../components/billing/UpgradePlanModal';
import { canUpgrade, getUpgradeablePlans } from '../config/planUpgrade';

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
};

const PLAN_BADGE_STYLES: Record<Plan, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  pro: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  agency: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
};

const formatAmount = (amount: number, currency: string) => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount / 100);
  }
  return `${currency} ${(amount / 100).toFixed(2)}`;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatShortDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function BillingPage() {
  const { user, fetchUser } = useAuthStore();
  const { usage, loading: usageLoading, refetch: refetchUsage } = usePlanUsage();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [highlightHistory, setHighlightHistory] = useState(false);

  const paymentHistoryRef = useRef<HTMLDivElement>(null);

  const currentPlan = (user?.plan || usage?.plan || 'free') as Plan;
  const upgradeablePlans = getUpgradeablePlans(currentPlan);
  const showUpgradeButton = canUpgrade(currentPlan);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get<{ payments: PaymentRecord[] }>('/payments/history');
      setPayments(data.payments || []);
    } catch {
      toast.error('Failed to load billing history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /** After successful payment: refresh plan, usage, history, and scroll to Payment History. */
  const handleUpgradeSuccess = useCallback(
    async (result: VerifyPaymentResponse) => {
      // Immediately show the new payment row while re-fetching full history
      if (result.payment) {
        setPayments((prev) => {
          const exists = prev.some((p) => p.orderId === result.payment!.orderId);
          return exists ? prev : [result.payment!, ...prev];
        });
      }

      await Promise.all([fetchUser(), refetchUsage(), fetchHistory()]);
      setHighlightHistory(true);

      requestAnimationFrame(() => {
        paymentHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      setTimeout(() => setHighlightHistory(false), 3000);
    },
    [fetchUser, refetchUsage, fetchHistory]
  );

  if (usageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Plan</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your subscription and view payment history
            </p>
          </div>
          {showUpgradeButton && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary inline-flex items-center gap-2 w-fit"
            >
              Upgrade Plan
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current plan card */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your current plan</p>
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {PLAN_LABELS[currentPlan]}
                </h2>
                <span
                  className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${PLAN_BADGE_STYLES[currentPlan]}`}
                >
                  Active
                </span>
              </div>

              {user?.planStartedAt && user?.planExpiresAt && currentPlan !== 'free' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    {formatShortDate(user.planStartedAt)} — {formatShortDate(user.planExpiresAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {usage && (
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Route className="w-4 h-4" />
                  AI Roadmaps
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatUsageLabel(usage.usage.roadmaps, usage.limits.roadmapsPerMonth)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <BotMessageSquare className="w-4 h-4" />
                  Mock Interviews
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatUsageLabel(usage.usage.interviews, usage.limits.interviewsPerMonth)}
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Usage resets at the start of each calendar month (UTC).
          </p>
        </div>

        {/* Payment history — scroll target after successful upgrade */}
        <div
          ref={paymentHistoryRef}
          className={[
            'glass-card overflow-hidden transition-shadow duration-500',
            highlightHistory ? 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20' : '',
          ].join(' ')}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h2>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Receipt className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No payments yet</p>
              {showUpgradeButton && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-cyan-600 hover:text-cyan-500 font-medium text-sm"
                >
                  Upgrade to a paid plan →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Invoice</th>
                    <th className="px-6 py-3 font-medium">Order ID</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-gray-100 dark:border-gray-800/80 last:border-0"
                    >
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 capitalize font-medium text-gray-900 dark:text-white">
                        {payment.plan}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                            payment.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : payment.status === 'failed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {payment.invoiceId || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {payment.orderId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
        upgradeablePlans={upgradeablePlans}
        onUpgradeSuccess={handleUpgradeSuccess}
      />
    </>
  );
}
