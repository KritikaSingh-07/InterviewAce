import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import {
  BotMessageSquare,
  Play,
  Clock,
  ChevronRight,
  Sparkles,
  Loader2,
  BrainCircuit,
  Award,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PlanUsageBanner from '../../components/billing/PlanUsageBanner';
import { usePlanUsage } from '../../hooks/usePlanUsage';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Interview {
  _id: string;
  role: string;
  type: string;
  status: string;
  totalScore: number;
  questions: Question[];
  createdAt: string;
}

interface Question {
  _id: string;
  question: string;
  questionType?: string;
  difficulty?: string;
  status?: string;
  questionNumber?: number;
  userAnswer?: string;
  score?: number;
  answered?: boolean;
}

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';
type InterviewType = 'technical' | 'behavioral' | 'mixed' | 'system-design';
type Duration = 1 | 5 | 10 | 15 | 20 | 30;

interface StartFormData {
  role: string;
  experience: ExperienceLevel;
  type: InterviewType;
  duration: Duration;
}

export default function MockInterview() {
  const navigate = useNavigate();
  const { usage, refetch: refetchUsage } = usePlanUsage();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartForm, setShowStartForm] = useState(false);
  const [starting, setStarting] = useState(false);
  const [formData, setFormData] = useState<StartFormData>({
    role: '',
    experience: 'mid',
    type: 'mixed',
    duration: 10,
  });

  // Memoized fetch function
  const fetchInterviews = useCallback(async () => {
    try {
      const { data } = await api.get('/interviews');
      setInterviews(data.interviews ?? []);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      toast.error('Could not load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + refetch on window focus
  useEffect(() => {
    fetchInterviews();
    const handleFocus = () => fetchInterviews();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchInterviews]);

  const startInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role.trim()) {
      toast.error('Please enter a target role');
      return;
    }
    setStarting(true);
    try {
      const { data } = await api.post('/interviews/start', formData);
      refetchUsage();
      navigate(`/dashboard/interviews/${data.interview._id}`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to start interview';
      toast.error(message);
    } finally {
      setStarting(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed')
      return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
    if (status === 'in-progress')
      return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
    return 'text-gray-500 bg-gray-50 dark:bg-gray-500/10';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const interviewAtLimit =
    usage !== null &&
    usage.limits.interviewsPerMonth !== null &&
    usage.usage.interviews >= usage.limits.interviewsPerMonth;

  // Derived stats for hero
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(
    (i) => i.status === 'completed'
  ).length;
  const averageScore =
    completedInterviews > 0
      ? Math.round(
        interviews
          .filter((i) => i.status === 'completed')
          .reduce((sum, i) => sum + (i.totalScore || 0), 0) /
        completedInterviews
      )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Plan usage banner */}
      {usage && <PlanUsageBanner usage={usage} highlight="interviews" />}

      {/* Premium Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white p-8 md:p-10 shadow-xl shadow-indigo-500/20"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              AI Mock Interviews
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Practice with realistic
              <br />
              AI-powered interviews
            </h1>
            <p className="text-white/80 max-w-lg">
              Sharpen your skills with real-time questions, voice input, and
              instant feedback tailored to your target role.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setShowStartForm(!showStartForm)}
                disabled={interviewAtLimit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-medium text-sm hover:bg-indigo-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {showStartForm ? 'Cancel' : 'Start Interview'}
              </button>
              <button
                onClick={() => setShowStartForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white font-medium text-sm hover:bg-white/30 transition-all active:scale-[0.98]"
              >
                <BrainCircuit className="w-4 h-4" />
                Try a Demo
              </button>
            </div>
          </div>

          {/* Stats mini cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <BotMessageSquare className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <div className="text-2xl font-bold">{totalInterviews}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/70">Interviews</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <div className="text-2xl font-bold">{averageScore}%</div>
              <div className="text-[10px] uppercase tracking-wide text-white/70">Avg Score</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <Award className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <div className="text-2xl font-bold">{completedInterviews}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/70">Completed</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Start Interview Form - premium card */}
      {showStartForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6"
        >
          <form onSubmit={startInterview} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Role
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Frontend Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience: e.target.value as ExperienceLevel,
                    })
                  }
                  className="input-field cursor-pointer"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead / Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interview Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as InterviewType,
                    })
                  }
                  className="input-field cursor-pointer"
                >
                  <option value="mixed">Mixed</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="system-design">System Design</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number(e.target.value) as Duration,
                    })
                  }
                  className="input-field cursor-pointer"
                >
                  <option value={1}>1 min</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={starting || interviewAtLimit}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 py-3"
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start AI Mock Interview
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* Interviews List - premium cards */}
      {interviews.length > 0 ? (
        <div className="grid gap-4">
          {interviews.map((interview, i) => (
            <motion.div
              key={interview._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/dashboard/interviews/${interview._id}`}
                className="group bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all"
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex-shrink-0">
                  <BotMessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {interview.role}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{interview.type}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {interview.questions?.length ?? 0} questions
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-xl font-bold ${getScoreColor(
                      interview.totalScore
                    )}`}
                  >
                    {interview.totalScore != null
                      ? interview.totalScore
                      : '-'}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
                      interview.status
                    )}`}
                  >
                    {interview.status === 'in-progress'
                      ? 'In Progress'
                      : interview.status === 'completed'
                        ? 'Completed'
                        : interview.status}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            No Interviews Yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start your first AI-powered mock interview to practice with
            realistic questions and get detailed feedback.
          </p>
          <button
            onClick={() => setShowStartForm(true)}
            disabled={interviewAtLimit}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Play className="w-5 h-5" />
            Start Your First Interview
          </button>
        </div>
      )}
    </div>
  );
}