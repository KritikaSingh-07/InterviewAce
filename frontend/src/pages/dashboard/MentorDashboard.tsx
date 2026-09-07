import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
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
import { MentorStudent, MentorInterviewSession } from '../../types';
import StudentCard from '../../components/mentor/StudentCard';
import StudentDetailModal from '../../components/mentor/StudentDetailModal';


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
  const [selectedDetailStudent, setSelectedDetailStudent] = useState<MentorStudent | null>(null);


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
            onClick={() => navigate('/dashboard/sessions')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Clock className="w-4 h-4" />
            Manage Availability
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
            onClick={() => {
              if (stat.label === 'Active Students') {
                navigate('/dashboard/students');
              }
            }}
            className={`glass-card p-6 ${stat.label === 'Active Students' ? 'cursor-pointer hover:border-violet-400 dark:hover:border-violet-500/50 hover:shadow-lg transition-all group' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.label === 'Active Students' && (
                <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 group-hover:underline flex items-center gap-1">
                  View All &rarr;
                </span>
              )}
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Students Directory</h2>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/students')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
                >
                  Open Students Section &rarr;
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">All registered Pro & Agency students on the platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        </div>


        {filteredStudents.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStudents.map((student, idx) => (
              <StudentCard
                key={student._id}
                student={student}
                index={idx}
                onSelect={(s) => setSelectedDetailStudent(s)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {search ? 'No students match your search' : 'No Model Pro or Agency students yet'}
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


      {/* Feedback Modal */}
      <Modal
        isOpen={feedbackOpen && !!feedbackInterview}
        onClose={() => setFeedbackOpen(false)}
        title={`Feedback — ${feedbackInterview?.studentName || ''}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedbackInterview?.type}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {feedbackInterview && new Date(feedbackInterview.scheduledAt || feedbackInterview.createdAt).toLocaleString()}
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
      </Modal>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedDetailStudent}
        isOpen={Boolean(selectedDetailStudent)}
        onClose={() => setSelectedDetailStudent(null)}
      />
    </div>
  );
}
