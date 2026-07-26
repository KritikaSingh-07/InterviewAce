import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Roadmap } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Video,
  FileText,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoadmapDetail() {
  const { id } = useParams<{ id: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  const fetchRoadmap = async () => {
    try {
      const { data } = await api.get(`/roadmaps/${id}`);
      setRoadmap(data.roadmap);
      if (data.roadmap.weeklyStructure?.length > 0) {
        setExpandedWeek(data.roadmap.weeklyStructure[0].week);
      }
    } catch (error) {
      toast.error('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      const { data } = await api.patch(`/roadmaps/${id}/tasks/${taskId}/complete`);
      setRoadmap(data.roadmap);
      toast.success('Task completed! +10 points');
    } catch (error) {
      toast.error('Failed to complete task');
    } finally {
      setCompletingTask(null);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'practice': return <Code2 className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Roadmap Not Found</h2>
        <Link to="/dashboard/roadmaps" className="text-indigo-500 hover:underline">Back to roadmaps</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/dashboard/roadmaps" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-500 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Roadmaps
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{roadmap.targetRole}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{roadmap.careerBio}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold gradient-text">{roadmap.progress.percentage}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Progress Overview</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {roadmap.progress.completedTasks}/{roadmap.progress.totalTasks} tasks
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${roadmap.progress.percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{roadmap.durationWeeks}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Weeks</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{roadmap.progress.completedTasks}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{roadmap.progress.totalTasks - roadmap.progress.completedTasks}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{roadmap.skillGapAnalysis?.length || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Skills to Learn</div>
          </div>
        </div>
      </div>

      {/* Skill Gap Analysis */}
      {roadmap.skillGapAnalysis && roadmap.skillGapAnalysis.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skill Gap Analysis</h2>
          <div className="grid gap-3">
            {roadmap.skillGapAnalysis.map((gap, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className={`w-2 h-2 rounded-full ${
                  gap.priority === 'critical' ? 'bg-red-500' : gap.priority === 'high' ? 'bg-amber-500' : 'bg-indigo-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{gap.skill}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {gap.currentLevel} → {gap.targetLevel}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  gap.priority === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                  gap.priority === 'high' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                  'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                }`}>
                  {gap.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Structure */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Plan</h2>
        {roadmap.weeklyStructure?.map((week) => (
          <motion.div
            key={week.week}
            initial={false}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  week.completed
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                }`}>
                  W{week.week}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Week {week.week}: {week.focus}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {week.days?.length || 0} days • {week.days?.filter(d => d.completed).length || 0} completed
                  </p>
                </div>
              </div>
              {expandedWeek === week.week ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {expandedWeek === week.week && (
              <div className="px-6 pb-6 space-y-3">
                {week.days?.map((day) => (
                  <div key={day._id} className={`p-4 rounded-xl border ${
                    day.completed
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-500/5'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => !day.completed && completeTask(day._id)}
                        disabled={day.completed || completingTask === day._id}
                        className="mt-1 flex-shrink-0"
                      >
                        {completingTask === day._id ? (
                          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        ) : day.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-indigo-500 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">Day {day.day}: {day.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{day.description}</p>

                        {day.topics && day.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {day.topics.map((topic, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400">
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}

                        {day.resources && day.resources.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {day.resources.map((resource, i) => (
                              <a
                                key={i}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-500 hover:border-indigo-300 transition-all"
                              >
                                {getResourceIcon(resource.type)}
                                {resource.title}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}

                        {day.practiceQuestions && day.practiceQuestions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Practice Questions</p>
                            {day.practiceQuestions.map((q, i) => (
                              <div key={i} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                    q.difficulty === 'hard' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                                    q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                  }`}>
                                    {q.difficulty}
                                  </span>
                                  <span className="text-xs text-gray-400">{q.type}</span>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{q.question}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

