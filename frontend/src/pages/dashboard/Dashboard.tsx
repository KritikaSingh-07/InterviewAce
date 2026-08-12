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
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      label: 'Interviews',
      value: stats.totalInterviews,
      sub: `Avg ${Math.round(stats.avgScore)}% score`,
      icon: BotMessageSquare,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Total Points',
      value: stats.totalPoints,
      sub: `${stats.weeklyPoints} this week`,
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Global Rank',
      value: `#${stats.rank || '-'}`,
      sub: 'Keep climbing!',
      icon: Trophy,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.profile?.fullName || 'Champion'}!
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Ready to ace your next interview?
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${action.color} text-white text-sm font-medium hover:shadow-lg transition-all active:scale-[0.98]`}
            >
              <action.icon className="w-4 h-4" />
              {action.title}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Roadmaps */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Roadmaps</h2>
            <Link to="/dashboard/roadmaps" className="text-sm text-indigo-500 hover:text-indigo-400 font-medium">
              View all
            </Link>
          </div>
          {recentRoadmaps.length > 0 ? (
            <div className="space-y-3">
              {recentRoadmaps.map((roadmap: any) => (
                <Link
                  key={roadmap._id}
                  to={`/dashboard/roadmaps/${roadmap._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                >
                  <div className={`p-2 rounded-lg ${
                    roadmap.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10'
                  }`}>
                    {roadmap.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {roadmap.targetRole}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {roadmap.progress?.percentage || 0}% • {roadmap.durationWeeks} weeks
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(roadmap.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Route className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No roadmaps yet</p>
              <Link to="/dashboard/roadmaps" className="text-indigo-500 text-sm font-medium hover:underline mt-2 inline-block">
                Create your first roadmap
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Interviews */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Interviews</h2>
            <Link to="/dashboard/interviews" className="text-sm text-indigo-500 hover:text-indigo-400 font-medium">
              View all
            </Link>
          </div>
          {recentInterviews.length > 0 ? (
            <div className="space-y-3">
              {recentInterviews.map((interview: any) => (
                <Link
                  key={interview._id}
                  to={`/dashboard/interviews/${interview._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                >
                  <div className={`p-2 rounded-lg ${
                    interview.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'
                  }`}>
                    {interview.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {interview.role} - {interview.type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Score: {interview.totalScore || '-'} • {interview.questions?.length || 0} questions
                    </p>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    interview.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>
                    {interview.status}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BotMessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No interviews yet</p>
              <Link to="/dashboard/interviews" className="text-indigo-500 text-sm font-medium hover:underline mt-2 inline-block">
                Start your first mock interview
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}