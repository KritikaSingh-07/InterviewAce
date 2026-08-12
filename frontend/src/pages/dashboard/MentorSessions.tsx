import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import {
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  Clock,
  Star,
  UserCircle2,
  FileText,
} from 'lucide-react';
import { MentorInterviewSession } from '../../types';

export default function MentorSessions() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<MentorInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'scheduled' | 'completed'>('all');

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mentor/interviews');
      setInterviews(data.interviews || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const filtered = interviews.filter((i) => {
    if (tab === 'scheduled') return i.status === 'scheduled';
    if (tab === 'completed') return i.status === 'completed';
    return true;
  });

  const tabs = [
    { key: 'all' as const, label: 'All', count: interviews.length },
    { key: 'scheduled' as const, label: 'Scheduled', count: interviews.filter((i) => i.status === 'scheduled').length },
    { key: 'completed' as const, label: 'Completed', count: interviews.filter((i) => i.status === 'completed').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">All mock interview sessions you've conducted</p>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-gray-900 text-violet-600 dark:text-violet-400 shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((interview, i) => (
            <motion.div
              key={interview._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="glass-card p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 dark:text-white">{interview.studentName}</p>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      {interview.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      interview.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {interview.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {new Date(interview.scheduledAt || interview.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {interview.duration} min
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {interview.status === 'completed' ? (
                    <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                      <Star className="w-4 h-4 text-amber-400" />
                      {interview.rating ?? interview.totalScore ?? 'N/A'}
                      <span className="text-xs text-gray-400">/100</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-500 font-medium text-sm">
                      <Clock className="w-4 h-4" /> Pending
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/dashboard/feedback')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No sessions found</p>
        </div>
      )}
    </div>
  );
}
