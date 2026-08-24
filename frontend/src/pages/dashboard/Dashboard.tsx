import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
  Route,
  BotMessageSquare,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Target,
} from 'lucide-react';

interface DashboardStats {
  totalRoadmaps: number;
  completedRoadmaps: number;
  totalInterviews: number;
  avgScore: number;
  totalPoints: number;
  weeklyPoints: number;
  rank: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalRoadmaps: 0,
    completedRoadmaps: 0,
    totalInterviews: 0,
    avgScore: 0,
    totalPoints: 0,
    weeklyPoints: 0,
    rank: 0,
  });
  const [recentRoadmaps, setRecentRoadmaps] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [roadmapsRes, interviewsRes, leaderboardRes] = await Promise.allSettled([
          api.get('/roadmaps'),
          api.get('/interviews'),
          api.get('/leaderboard/me'),
        ]);

        const roadmaps = roadmapsRes.status === 'fulfilled' ? (roadmapsRes.value.data.roadmaps || []) : [];
        const interviews = interviewsRes.status === 'fulfilled' ? (interviewsRes.value.data.interviews || []) : [];
        const lb = leaderboardRes.status === 'fulfilled' ? leaderboardRes.value.data.leaderboard : null;

        if (roadmapsRes.status === 'rejected') console.error('Failed to fetch roadmaps:', roadmapsRes.reason);
        if (interviewsRes.status === 'rejected') console.error('Failed to fetch interviews:', interviewsRes.reason);
        if (leaderboardRes.status === 'rejected') console.error('Failed to fetch leaderboard:', leaderboardRes.reason);

        setRecentRoadmaps(roadmaps.slice(0, 3));
        setRecentInterviews(interviews.slice(0, 3));

        setStats({
          totalRoadmaps: roadmaps.length,
          completedRoadmaps: roadmaps.filter((r: any) => r.status === 'completed').length,
          totalInterviews: interviews.length,
          avgScore: lb?.stats?.averageScore || 0,
          totalPoints: lb?.totalPoints || 0,
          weeklyPoints: lb?.weeklyPoints || 0,
          rank: lb?.rank || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Generate Roadmap',
      desc: 'Create AI-powered study plan',
      icon: Route,
      link: '/dashboard/roadmaps',
      color: 'from-indigo-500 to-violet-500',
    },
    {
      title: 'Start Interview',
      desc: 'Practice with AI interviewer',
      icon: BotMessageSquare,
      link: '/dashboard/interviews',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'View Leaderboard',
      desc: 'Check your ranking',
      icon: Trophy,
      link: '/dashboard/leaderboard',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const statCards = [
    {
      label: 'Roadmaps',
      value: stats.totalRoadmaps,
      sub: `${stats.completedRoadmaps} completed`,
      icon: Route,
      color: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      label: 'Interviews',
      value: stats.totalInterviews,
      sub: `Avg ${Math.round(stats.avgScore)}% score`,
      icon: BotMessageSquare,
      color: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Total Points',
      value: stats.totalPoints,
      sub: `${stats.weeklyPoints} this week`,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Global Rank',
      value: `#${stats.rank || '-'}`,
      sub: 'Keep climbing!',
      icon: Trophy,
      color: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const performancePercent = Math.min(100, Math.round(stats.avgScore || 0));
  const circumference = 2 * Math.PI * 36;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-8 text-white shadow-lg shadow-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Sparkles className="w-4 h-4" />
              AI Interview Preparation Suite
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back, {user?.profile?.fullName || 'Champion'}!
            </h1>
            <p className="text-white/80 max-w-lg">
              Ready to ace your next interview? Your personalized roadmap and AI mock interviews are waiting.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.link}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-medium transition-all hover:scale-105 active:scale-[0.98]"
                >
                  <action.icon className="w-4 h-4" />
                  {action.title}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (performancePercent / 100) * circumference}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{performancePercent}%</span>
                <span className="text-[10px] uppercase tracking-wider text-white/80">Avg Score</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Premium minimalist cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="group relative bg-white dark:bg-gray-900/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-5">
              <div className={`p-2.5 rounded-xl ${stat.iconBg} transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-400">+12%</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity - Premium list cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Roadmaps */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900/60 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Roadmaps</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your latest study plans</p>
            </div>
            <Link to="/dashboard/roadmaps" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentRoadmaps.length > 0 ? (
            <div className="space-y-2">
              {recentRoadmaps.map((roadmap: any) => (
                <Link
                  key={roadmap._id}
                  to={`/dashboard/roadmaps/${roadmap._id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <div className={`p-2 rounded-lg ${roadmap.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10'
                    }`}>
                    {roadmap.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {roadmap.targetRole}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> {roadmap.progress?.percentage || 0}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {roadmap.durationWeeks} weeks
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(roadmap.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Route className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No roadmaps yet</p>
              <Link to="/dashboard/roadmaps" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline mt-2 inline-block">
                Create your first roadmap
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Interviews */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900/60 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Interviews</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your practice sessions</p>
            </div>
            <Link to="/dashboard/interviews" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentInterviews.length > 0 ? (
            <div className="space-y-2">
              {recentInterviews.map((interview: any) => (
                <Link
                  key={interview._id}
                  to={`/dashboard/interviews/${interview._id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <div className={`p-2 rounded-lg ${interview.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'
                    }`}>
                    {interview.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {interview.role} - {interview.type}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> Score: {interview.totalScore || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> {interview.questions?.length || 0} questions
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${interview.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                    {interview.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <BotMessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No interviews yet</p>
              <Link to="/dashboard/interviews" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline mt-2 inline-block">
                Start your first mock interview
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}