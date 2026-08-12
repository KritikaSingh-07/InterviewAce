import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import {
  Route,
  Zap,
  Brain,
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PlanUsageBanner from '../../components/billing/PlanUsageBanner';
import { usePlanUsage } from '../../hooks/usePlanUsage';

interface Roadmap {
  _id: string;
  targetRole: string;
  status: string;
  durationWeeks: number;
  progress: { percentage: number; totalTasks: number; completedTasks: number };
  createdAt: string;
}

export default function RoadmapGenerator() {
  const navigate = useNavigate();
  const { usage, refetch: refetchUsage } = usePlanUsage();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetRole: '',
    careerBio: '',
    skills: '',
    duration: 4,
  });

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const { data } = await api.get('/roadmaps');
      setRoadmaps(data.roadmaps || []);
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const { data } = await api.post('/roadmaps/generate', {
        targetRole: formData.targetRole,
        careerBio: formData.careerBio,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        duration: formData.duration,
      });
      toast.success('Roadmap generated successfully!');
      refetchUsage();
      navigate(`/dashboard/roadmaps/${data.roadmap._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
      case 'completed': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
      case 'generating': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-500/10';
    }
  };

  const roadmapAtLimit =
    usage !== null &&
    usage.limits.roadmapsPerMonth !== null &&
    usage.usage.roadmaps >= usage.limits.roadmapsPerMonth;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {usage && <PlanUsageBanner usage={usage} highlight="roadmaps" />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Roadmaps</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate personalized study plans</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={roadmapAtLimit}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Roadmap'}
        </button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <form onSubmit={generateRoadmap} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Target Job Role</label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Frontend Engineer, Data Scientist"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Career Bio / Summary</label>
                <textarea
                  value={formData.careerBio}
                  onChange={(e) => setFormData({ ...formData, careerBio: e.target.value })}
                  className="input-field h-24 resize-none"
                  placeholder="Tell us about your experience, current skills, and what you want to achieve..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="input-field"
                  placeholder="React, Node.js, TypeScript..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (weeks)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {[2, 4, 6, 8, 12].map((w) => (
                    <option key={w} value={w}>{w} weeks</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={generating || roadmapAtLimit}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating your roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate AI Roadmap
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* Roadmaps List */}
      {roadmaps.length > 0 ? (
        <div className="grid gap-4">
          {roadmaps.map((roadmap, i) => (
            <motion.div
              key={roadmap._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/dashboard/roadmaps/${roadmap._id}`}
                className="glass-card p-6 flex items-center gap-4 group"
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {roadmap.targetRole}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {roadmap.durationWeeks} weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {roadmap.progress.completedTasks}/{roadmap.progress.totalTasks} tasks
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${roadmap.progress.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(roadmap.status)}`}>
                    {roadmap.status}
                  </span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {roadmap.progress.percentage}%
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center">
            <Brain className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No Roadmaps Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Generate your first AI-powered roadmap to get a personalized study plan tailored to your target role.
          </p>
          <button
            onClick={() => setShowForm(true)}
            disabled={roadmapAtLimit}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="w-5 h-5" />
            Generate Your First Roadmap
          </button>
        </div>
      )}
    </div>
  );
}

