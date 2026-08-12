import { Link } from 'react-router-dom';
import { ArrowUpRight, Route, BotMessageSquare } from 'lucide-react';
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

  return (
    <div className="glass-card p-4 md:p-5 border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Current plan</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {PLAN_LABELS[usage.plan]} Plan
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {(highlight === 'both' || highlight === 'roadmaps') && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Route className="w-4 h-4 text-indigo-500" />
              <span>{formatUsageLabel(usage.usage.roadmaps, usage.limits.roadmapsPerMonth)} roadmaps</span>
            </div>
          )}
          {(highlight === 'both' || highlight === 'interviews') && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <BotMessageSquare className="w-4 h-4 text-emerald-500" />
              <span>
                {formatUsageLabel(usage.usage.interviews, usage.limits.interviewsPerMonth)} interviews
              </span>
            </div>
          )}
        </div>

        {showUpgrade && usage.plan !== 'agency' && (
          <Link
            to="/#pricing"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-500"
          >
            Upgrade plan
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
