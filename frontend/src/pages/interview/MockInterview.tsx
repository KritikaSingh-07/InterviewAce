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
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  // Initial fetch + refetch on window focus (e.g., returning from an interview)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Mock Interviews
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Practice with realistic AI-powered interviews
          </p>
        </div>
        <button
          onClick={() => setShowStartForm(!showStartForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {showStartForm ? 'Cancel' : 'Start Interview'}
        </button>
      </div>

      {/* Start Interview Form */}
      {showStartForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <form onSubmit={startInterview} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Target Role</label>
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
                <label className="block text-sm font-medium mb-2">
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
                  className="input-field"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead / Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="input-field"
                >
                  <option value="mixed">Mixed</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="system-design">System Design</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="input-field"
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
              disabled={starting}
              className="btn-primary w-full flex items-center justify-center gap-2"
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

      {/* Interviews List */}
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
                className="glass-card p-6 flex items-center gap-4 group"
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
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
                    {/* Show 0 instead of dash when score is exactly 0 */}
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10 flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-emerald-500" />
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
            className="btn-primary inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Your First Interview
          </button>
        </div>
      )}
    </div>
  );
}