import { Link } from 'react-router-dom';
import { ArrowUpRight, Route, BotMessageSquare, Sparkles } from 'lucide-react';
import { PlanUsageSummary, formatUsageLabel } from '../../hooks/usePlanUsage';
import { Plan } from '../../types';

interface PlanUsageBannerProps {
  usage: PlanUsageSummary;
  highlight?: 'roadmaps' | 'interviews' | 'both';
}

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
};

export default function PlanUsageBanner({ usage, highlight = 'both' }: PlanUsageBannerProps) {
  const roadmapAtLimit =
    usage.limits.roadmapsPerMonth !== null &&
    usage.usage.roadmaps >= usage.limits.roadmapsPerMonth;
  const interviewAtLimit =
    usage.limits.interviewsPerMonth !== null &&
    usage.usage.interviews >= usage.limits.interviewsPerMonth;

  const showUpgrade =
    (highlight === 'roadmaps' && roadmapAtLimit) ||
    (highlight === 'interviews' && interviewAtLimit) ||
    (highlight === 'both' && (roadmapAtLimit || interviewAtLimit));

  // Helper to compute progress percentage (0-100)
  const getProgress = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const renderUsageItem = (
    icon: React.ReactNode,
    label: string,
    used: number,
    limit: number | null,
    color: string,
    barColor: string
  ) => (
    <div className="flex-1 min-w-[180px]">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-900 dark:text-white">
          {formatUsageLabel(used, limit)}
        </span>
        {limit && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {Math.round(getProgress(used, limit))}%
          </span>
        )}
      </div>
      {limit && (
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${getProgress(used, limit)}%` }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-emerald-50/50 dark:from-indigo-500/5 dark:to-emerald-500/5 pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Plan info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current plan</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {PLAN_LABELS[usage.plan]} Plan
            </p>
          </div>
        </div>

        {/* Usage stats */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-6">
          {(highlight === 'both' || highlight === 'roadmaps') &&
            renderUsageItem(
              <Route className="w-4 h-4 text-indigo-500 flex-shrink-0" />,
              'Roadmaps',
              usage.usage.roadmaps,
              usage.limits.roadmapsPerMonth,
              'text-indigo-500',
              'bg-indigo-500'
            )}
          {(highlight === 'both' || highlight === 'interviews') &&
            renderUsageItem(
              <BotMessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
              'Interviews',
              usage.usage.interviews,
              usage.limits.interviewsPerMonth,
              'text-emerald-500',
              'bg-emerald-500'
            )}
        </div>

        {/* Upgrade button */}
        {showUpgrade && usage.plan !== 'agency' && (
          <Link
            to="/#pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all active:scale-[0.98] shadow-sm whitespace-nowrap"
          >
            Upgrade plan
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}