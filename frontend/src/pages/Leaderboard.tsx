import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Award,
  Flame,
  Loader2,
  Sparkles,
  Users,
  Target,
  BarChart3,
} from 'lucide-react';

interface LeaderUser {
  _id: string;
  user: {
    _id: string;
    email: string;
    profile?: { fullName: string; avatar: string };
  } | string;
  totalPoints: number;
  weeklyPoints: number;
  rank: number;
  weeklyRank: number;
  badges: any[];
  streak: { current: number; longest: number };
  stats: { interviewsCompleted: number; tasksCompleted: number; averageScore: number };
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderUser[]>([]);
  const [myStats, setMyStats] = useState<LeaderUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'weekly'>('global');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'global' ? '/leaderboard' : '/leaderboard/weekly';
      const [leadersRes, meRes] = await Promise.all([
        api.get(endpoint),
        api.get('/leaderboard/me'),
      ]);
      setLeaders(leadersRes.data.leaders || []);
      setMyStats(meRes.data.leaderboard || null);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-5 text-center">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800';
    if (rank === 2) return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    if (rank === 3) return 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800';
    return 'border-gray-100 dark:border-gray-800';
  };

  // Helper to extract user display info from union type
  const getUserInfo = (entry: LeaderUser) => {
    if (typeof entry.user === 'object' && entry.user) {
      return {
        name: entry.user.profile?.fullName || entry.user.email?.split('@')[0] || 'Anonymous',
        avatar: entry.user.profile?.avatar || '',
      };
    }
    return { name: 'User', avatar: '' };
  };

  return (
    <div className="space-y-8">
      {/* Premium Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-8 md:p-10 text-white shadow-xl shadow-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Leaderboard
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Compete and climb the rankings
            </h1>
            <p className="text-white/80 max-w-lg">
              Earn points by completing interviews and tasks. Rise to the top and unlock achievements!
            </p>

            {/* Tabs moved inside hero for premium look */}
            <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('global')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'global'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-white/70 hover:text-white'
                  }`}
              >
                Global Rankings
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'weekly'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-white/70 hover:text-white'
                  }`}
              >
                Weekly Rankings
              </button>
            </div>
          </div>

          {/* My ranking summary card */}
          {myStats && (
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70 uppercase tracking-wide">Your Global Rank</p>
                  <p className="text-3xl font-bold">#{myStats.rank || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                  <div className="text-xl font-bold">{myStats.totalPoints}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/70">Total Points</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                  <div className="text-xl font-bold">{myStats.weeklyPoints}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/70">Weekly Points</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Additional stats row */}
      {myStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Avg Score</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(myStats.stats?.averageScore || 0)}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Interviews</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {myStats.stats?.interviewsCompleted || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {myStats.stats?.tasksCompleted || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Current Streak</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {myStats.streak?.current || 0} days
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((entry, i) => {
            const userInfo = getUserInfo(entry);
            return (
              <motion.div
                key={entry._id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border ${getRankBg(entry.rank || i + 1)} hover:shadow-md transition-all`}
              >
                {/* Rank badge */}
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(entry.rank || i + 1)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {userInfo.avatar ? (
                    <img src={userInfo.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {userInfo.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{entry.stats?.interviewsCompleted || 0} interviews</span>
                    <span>{entry.stats?.tasksCompleted || 0} tasks</span>
                    {entry.streak?.current > 0 && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Flame className="w-3 h-3" /> {entry.streak.current} day streak
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {activeTab === 'global' ? entry.totalPoints : entry.weeklyPoints}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">pts</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Badges Section */}
      {myStats?.badges && myStats.badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Your Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            {myStats.badges.map((badge: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800"
              >
                <span className="text-lg">{badge.icon || '🏆'}</span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{badge.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}