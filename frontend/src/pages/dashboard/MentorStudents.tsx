import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import {
  Users,
  Search,
  Target,
  GraduationCap,
  Layers,
  Mail,
  CalendarClock,
  UserCircle2,
} from 'lucide-react';
import { MentorStudent } from '../../types';

export default function MentorStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<MentorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mentor/students');
      setStudents(data.students || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter((s) =>
    `${s.fullName} ${s.careerGoal} ${s.college} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Browse all active students on the platform</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="input-field pl-9 !py-2.5 text-sm w-full sm:w-72"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((student, i) => (
          <motion.div
            key={student._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
            className="glass-card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-500/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                  <UserCircle2 className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{student.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3" /> {student.email}
                </p>
              </div>
              <div className={`shrink-0 text-center px-3 py-1.5 rounded-xl ${
                student.score >= 70
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : student.score >= 40
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                <div className="text-lg font-bold">{Math.round(student.score)}</div>
                <div className="text-[10px] uppercase tracking-wide">AI Score</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{student.careerGoal || 'No target set'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{student.college || 'N/A'} • {student.branch || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{student.degree || 'N/A'} • Year {student.year}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {student.targetCompanies?.slice(0, 3).map((c) => (
                <span key={c} className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {c}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <span>{student.interviewsCompleted} interviews</span>
              <span>•</span>
              <span>{student.totalPoints} pts</span>
            </div>

            <button
              onClick={() => navigate('/dashboard', { state: { scheduleStudent: student._id } })}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <CalendarClock className="w-4 h-4" />
              Schedule Interview
            </button>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 glass-card">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search ? 'No students match your search' : 'No active students yet'}
          </p>
        </div>
      )}
    </div>
  );
}
