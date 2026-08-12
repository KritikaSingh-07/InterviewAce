import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { Plan } from '../types';

export interface PlanUsageSummary {
  plan: Plan;
  limits: {
    roadmapsPerMonth: number | null;
    interviewsPerMonth: number | null;
  };
  usage: {
    roadmaps: number;
    interviews: number;
  };
  remaining: {
    roadmaps: number | null;
    interviews: number | null;
  };
  periodStart: string;
}

export function usePlanUsage() {
  const [usage, setUsage] = useState<PlanUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const { data } = await api.get<PlanUsageSummary>('/payments/usage');
      setUsage(data);
    } catch {
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, refetch: fetchUsage };
}

export const formatLimit = (value: number | null) =>
  value === null ? 'Unlimited' : String(value);

export const formatUsageLabel = (used: number, limit: number | null) =>
  limit === null ? `${used} used (Unlimited)` : `${used} / ${limit} used this month`;
