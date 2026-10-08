import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import {
  Award,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  BookOpen,
  HeartHandshake,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface FeedbackAnalytics {
  overallScore: number;
  totalFeedback: number;
  categories: {
    communication: number;
    explanation: number;
    technicalKnowledge: number;
    problemSolving: number;
    patience: number;
    professionalism: number;
    guidance: number;
  };
}

export default function MentorFeedback() {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mentor/feedback-analytics');
      setAnalytics(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load mentor feedback analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const overallScore = analytics?.overallScore || 0;
  const totalFeedback = analytics?.totalFeedback || 0;
  const categories = analytics?.categories || {
    communication: 0,
    explanation: 0,
    technicalKnowledge: 0,
    problemSolving: 0,
    patience: 0,
    professionalism: 0,
    guidance: 0,
  };

  const categoryList = [
    { key: 'communication', label: 'Communication', score: categories.communication, icon: MessageSquare, color: 'from-indigo-500 to-violet-500' },
    { key: 'explanation', label: 'Explanation', score: categories.explanation, icon: BookOpen, color: 'from-purple-500 to-pink-500' },
    { key: 'technicalKnowledge', label: 'Technical Knowledge', score: categories.technicalKnowledge, icon: Zap, color: 'from-amber-500 to-indigo-500' },
    { key: 'problemSolving', label: 'Problem Solving', score: categories.problemSolving, icon: Sparkles, color: 'from-amber-500 to-orange-500' },
    { key: 'patience', label: 'Patience', score: categories.patience, icon: HeartHandshake, color: 'from-teal-500 to-emerald-500' },
    { key: 'professionalism', label: 'Professionalism', score: categories.professionalism, icon: ShieldCheck, color: 'from-violet-500 to-purple-600' },
    { key: 'guidance', label: 'Guidance', score: categories.guidance, icon: Award, color: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Overall Mentor Feedback
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Aggregated performance metrics based on student session evaluations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            {totalFeedback} Submissions
          </span>
        </div>
      </motion.div>

      {/* Main Score & Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Circular Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            Overall Score
          </h2>

          {/* Circular Score Gauge */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-150 dark:text-gray-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - overallScore / 100)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#480001" />
                  <stop offset="100%" stopColor="#c9303a" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {overallScore}
              </span>
              <span className="text-xs font-bold text-gray-400">/ 100</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Overall Performance
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Based on {totalFeedback} student feedback submission{totalFeedback === 1 ? '' : 's'}
            </p>
          </div>
        </motion.div>

        {/* Category Breakdown Progress Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 lg:col-span-2 glass-card p-8 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              Category Metrics Breakdown
            </h2>
            <span className="text-xs font-semibold text-gray-400">Scores out of 100</span>
          </div>

          <div className="space-y-5">
            {categoryList.map((cat, index) => {
              const IconComp = cat.icon;
              return (
                <div key={cat.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        <IconComp className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {cat.label}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">
                      {cat.score} <span className="text-xs text-gray-400 font-normal">/ 100</span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="h-3 w-full bg-gray-150 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.score}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
