import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
  Users,
  ClipboardList,
  MessageSquareText,
  CalendarClock,
  Sparkles,
  GraduationCap,
  Target,
  Layers,
  Star,
  TrendingUp,
  Loader2,
  X,
  Mail,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Award,
  Briefcase,
  Search,
} from 'lucide-react';
import {
  MentorStudent,
  MentorInterviewSession,
} from '../../types';

const INTERVIEW_TYPES = [
  'Technical Round',
  'Behavioral',
  'System Design',
  'HR Screening',
  'Mixed',
];

const DURATIONS = [5, 10, 15, 20, 30];

export default function MentorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [students, setStudents] = useState<MentorStudent[]>([]);
  const [interviews, setInterviews] = useState<MentorInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Schedule modal state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(15);
  const [type, setType] = useState('Technical Round');
  const [submitting, setSubmitting] = useState(false);

  // Feedback modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState<MentorInterviewSession | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(80);
  const [feedbackSuggestions, setFeedbackSuggestions] = useState('');
  const [feedbackStrengths, setFeedbackStrengths] = useState('');
  const [feedbackImprove, setFeedbackImprove] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, interviewsRes] = await Promise.all([
        api.get('/mentor/students'),
        api.get('/mentor/interviews'),
      ]);
      setStudents(studentsRes.data.students || []);
      setInterviews(interviewsRes.data.interviews || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load mentor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openSchedule = (studentId?: string) => {
    setSelectedStudent(studentId || '');
    setScheduledAt('');
    setDuration(15);
    setType('Technical Round');
    setScheduleOpen(true);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    if (!scheduledAt) {
      toast.error('Please select a start time');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/mentor/interviews', {
        studentId: selectedStudent,
        scheduledAt,
        duration,
        type,
      });
      toast.success('Interview scheduled! The student has been notified.');
      setScheduleOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  const openFeedback = (interview: MentorInterviewSession) => {
    setFeedbackInterview(interview);
    setFeedbackRating(interview.rating || 80);
    setFeedbackSuggestions(interview.suggestions || '');
    setFeedbackStrengths(interview.mentorFeedback?.strengths?.join(', ') || '');
    setFeedbackImprove(interview.mentorFeedback?.areasToImprove?.join(', ') || '');
    setFeedbackOpen(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInterview) return;
    setSubmitting(true);
    try {
      await api.post(`/mentor/interviews/${feedbackInterview._id}/feedback`, {
        rating: feedbackRating,
        suggestions: feedbackSuggestions,
        strengths: feedbackStrengths.split(',').map((s) => s.trim()).filter(Boolean),
        areasToImprove: feedbackImprove.split(',').map((s) => s.trim()).filter(Boolean),
        status: 'completed',
      });
      toast.success('Feedback submitted successfully!');
      setFeedbackOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const exportFeedback = (interview: MentorInterviewSession) => {
    const content = [
      `INTERVIEWACE - MENTOR FEEDBACK REPORT`,
      `========================================`,
      `Student: ${interview.studentName || 'N/A'}`,
      `Interview Type: ${interview.type}`,
      `Date: ${new Date(interview.scheduledAt || interview.createdAt).toLocaleString()}`,
      `Duration: ${interview.duration} min`,
      `Rating: ${interview.rating ?? interview.totalScore ?? 'N/A'}/100`,
      ``,
      `Mentor Suggestions:`,
      interview.suggestions || 'No suggestions provided',
      ``,
      `Strengths:`,
      interview.mentorFeedback?.strengths?.join('\n') || 'N/A',
      ``,
      `Areas to Improve:`,
      interview.mentorFeedback?.areasToImprove?.join('\n') || 'N/A',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${interview.studentName || 'student'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter((s) =>
    `${s.fullName} ${s.careerGoal} ${s.college} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const completedInterviews = interviews.filter((i) => i.status === 'completed');
  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled');

  const statCards = [
    {
      label: 'Active Students',
      value: students.length,
      sub: 'Registered on platform',
      icon: Users,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      label: 'Scheduled',
      value: scheduledInterviews.length,
      sub: 'Upcoming sessions',
      icon: CalendarClock,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: completedInterviews.length,
      sub: 'Interviews conducted',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Avg Rating',
      value: completedInterviews.length
        ? (completedInterviews.reduce((s, i) => s + (i.rating || i.totalScore || 0), 0) / completedInterviews.length).toFixed(0)
        : 0,
      sub: 'Across all sessions',
      icon: Star,
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.profile?.fullName || 'Mentor'}!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Guide your students toward success with mock interviews and feedback.
            </p>
          </div>
          <button
            onClick={() => openSchedule()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <CalendarClock className="w-4 h-4" />
            Schedule Interview
          </button>
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

      {/* Section 1: Active Students Directory */}
      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Students Directory</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">All registered students on the platform</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="input-field pl-9 !py-2 text-sm w-full sm:w-64"
            />
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  {student.profileImage ? (
                    <img
                      src={student.profileImage}
                      alt={student.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold">
                      {student.fullName?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{student.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3" /> {student.email}
                    </p>
                  </div>
                  <div className={`text-right shrink-0 ${student.score >= 70 ? 'text-emerald-500' : student.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                    <div className="text-xl font-bold">{Math.round(student.score)}</div>
                    <div className="text-[10px] uppercase tracking-wide">AI Score</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <span className="truncate">{student.careerGoal || 'No target set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    <span className="truncate">
                      {student.college || 'N/A'} • {student.branch || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Layers className="w-4 h-4 text-indigo-500" />
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

                <button
                  onClick={() => openSchedule(student._id)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <CalendarClock className="w-4 h-4" />
                  Schedule Mock Interview
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {search ? 'No students match your search' : 'No active students yet'}
            </p>
          </div>
        )}
      </motion.section>

      {/* Section 3: Past Interviews & Feedback Log */}
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
            <MessageSquareText className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Past Interviews & Feedback Log</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed sessions conducted by you</p>
          </div>
        </div>

        {completedInterviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Student</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Date / Time</th>
                  <th className="pb-3 pr-4 font-medium">Rating</th>
                  <th className="pb-3 pr-4 font-medium">Suggestions</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedInterviews.map((interview) => (
                  <tr key={interview._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                          {interview.studentName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{interview.studentName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                        {interview.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                      {new Date(interview.scheduledAt || interview.createdAt).toLocaleDateString()}
                      <span className="block text-xs">
                        {new Date(interview.scheduledAt || interview.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                        <Star className="w-4 h-4 text-amber-400" />
                        {interview.rating ?? interview.totalScore ?? 'N/A'}
                        <span className="text-xs text-gray-400">/100</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 max-w-[240px]">
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                        {interview.suggestions || 'No suggestions provided'}
                      </p>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openFeedback(interview)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Feedback
                        </button>
                        <button
                          onClick={() => exportFeedback(interview)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Export
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No completed interviews yet</p>
          </div>
        )}
      </motion.section>

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {scheduleOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setScheduleOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-violet-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule Mock Interview</h3>
                  </div>
                  <button onClick={() => setScheduleOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSchedule} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Student *
                    </label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="">Choose a student...</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.fullName} — {s.careerGoal || 'Student'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duration *
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="input-field cursor-pointer"
                      >
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>{d} mins</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Interview Type *
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="input-field cursor-pointer"
                      >
                        {INTERVIEW_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    The selected student will be notified about this session.
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setScheduleOpen(false)}
                      className="flex-1 btn-secondary py-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                      Schedule Session
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackOpen && feedbackInterview && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedbackOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Feedback — {feedbackInterview.studentName}
                    </h3>
                  </div>
                  <button onClick={() => setFeedbackOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitFeedback} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedbackInterview.type}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(feedbackInterview.scheduledAt || feedbackInterview.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mentor Rating (0-100) *
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={feedbackRating}
                        onChange={(e) => setFeedbackRating(Number(e.target.value))}
                        className="flex-1 accent-violet-600"
                      />
                      <span className="w-14 text-center font-bold text-violet-600 dark:text-violet-400">
                        {feedbackRating}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Detailed Feedback & Suggestions *
                    </label>
                    <textarea
                      value={feedbackSuggestions}
                      onChange={(e) => setFeedbackSuggestions(e.target.value)}
                      className="input-field h-24 resize-none"
                      placeholder="Share constructive feedback, strengths, and areas for improvement..."
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Strengths (comma separated)
                      </label>
                      <input
                        value={feedbackStrengths}
                        onChange={(e) => setFeedbackStrengths(e.target.value)}
                        className="input-field"
                        placeholder="e.g. Strong DSA, Clear communication"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Areas to Improve (comma separated)
                      </label>
                      <input
                        value={feedbackImprove}
                        onChange={(e) => setFeedbackImprove(e.target.value)}
                        className="input-field"
                        placeholder="e.g. System design, Time management"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackOpen(false)}
                      className="flex-1 btn-secondary py-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      Submit Feedback
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
