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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Compete and climb the rankings</p>
        </div>
      </div>

      {/* My Stats Card */}
      {myStats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-2 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Ranking</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Keep practicing to improve!</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">#{myStats.rank || '-'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Global Rank</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{myStats.totalPoints}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Points</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{myStats.weeklyPoints}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Weekly Points</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round(myStats.stats?.averageScore || 0)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'global' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
        >
          Global Rankings
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'weekly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
        >
          Weekly Rankings
        </button>
      </div>

      {/* Leaderboard List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {leaders.map((entry, i) => (
            <motion.div
              key={entry._id || i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card p-4 flex items-center gap-4 border ${getRankBg(entry.rank)} ${activeTab === 'weekly' ? 'border-amber-200 dark:border-amber-800' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {typeof entry.user === 'object' && entry.user?.profile?.fullName
                    ? entry.user.profile.fullName.charAt(0).toUpperCase()
                    : '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {typeof entry.user === 'object' ? entry.user?.profile?.fullName || entry.user.email?.split('@')[0] || 'Anonymous' : 'User'}
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
              <div className="text-right">
                <div className="text-lg font-bold gradient-text">{entry.totalPoints || entry.weeklyPoints}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">pts</div>
              </div>
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank || i + 1)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Badges Section */}
      {myStats?.badges && myStats.badges.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Your Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            {myStats.badges.map((badge: any, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800">
                <span className="text-lg">{badge.icon || '🏆'}</span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

