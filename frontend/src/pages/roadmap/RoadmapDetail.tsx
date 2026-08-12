import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Roadmap, TaskDay, PracticeQuestion } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
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
  Send,
  Star,
  Lightbulb,
  Target,
  Zap,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface AiFeedback {
  score: number;
  pointsEarned: number;
  dayAutoCompleted: boolean;
  idealAnswer: string;
  explanation: string;
  keyPoints: string[];
  diagram?: string;
  strengthsInAnswer?: string[];
  improvementAreas?: string[];
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function RoadmapDetail() {
  const { id } = useParams<{ id: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // Per-question state: which question has its input open, and the current draft
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Store feedback keyed by questionId
  const [feedbackMap, setFeedbackMap] = useState<Record<string, AiFeedback>>({});

  /* ── Fetch ────────────────────────────────────────────────────────────── */
  const fetchRoadmap = useCallback(async () => {
    try {
      const { data } = await api.get(`/roadmaps/${id}`);
      setRoadmap(data.roadmap);
      document.title = `${data.roadmap.targetRole} — Roadmap | InterviewAce`;
      if (data.roadmap.weeklyStructure?.length > 0) {
        setExpandedWeek(data.roadmap.weeklyStructure[0].week);
      }
    } catch {
      toast.error('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);
  useEffect(() => { return () => { document.title = 'InterviewAce'; }; }, []);

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  /** Returns true if this day is unlocked (day 1 always unlocked, others need previous day done) */
  const isDayUnlocked = (weekDays: TaskDay[], dayIndex: number) => {
    if (dayIndex === 0) return true;
    return weekDays[dayIndex - 1]?.completed === true;
  };

  /** Returns true if ALL days up to (but not including) the current week's first day are done */
  const isWeekUnlocked = (weekIndex: number) => {
    if (!roadmap || weekIndex === 0) return true;
    const prevWeek = roadmap.weeklyStructure[weekIndex - 1];
    return prevWeek?.days?.every((d: TaskDay) => d.completed) ?? false;
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':         return <Video    className="w-4 h-4" />;
      case 'article':       return <FileText className="w-4 h-4" />;
      case 'practice':      return <Code2    className="w-4 h-4" />;
      default:              return <BookOpen className="w-4 h-4" />;
    }
  };

  const difficultyStyle = (d?: string) => {
    if (d === 'hard')   return 'bg-red-50    text-red-600    dark:bg-red-500/10    dark:text-red-400';
    if (d === 'medium') return 'bg-amber-50  text-amber-600  dark:bg-amber-500/10  dark:text-amber-400';
    return                     'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
  };

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-amber-500' : 'text-red-500';

  const scoreLabel = (s: number) =>
    s >= 80 ? 'Excellent 🎉' : s >= 60 ? 'Good 👍' : s >= 40 ? 'Needs Work 💪' : 'Keep Practicing 📚';

  /* ── Submit answer ────────────────────────────────────────────────────── */
  const handleSubmitAnswer = async (day: TaskDay, question: PracticeQuestion) => {
    if (!draftAnswer.trim() || draftAnswer.trim().length < 10) {
      toast.error('Please write at least 10 characters');
      return;
    }
    setSubmittingId(question._id);
    try {
      const { data } = await api.post(
        `/roadmaps/${id}/tasks/${day._id}/questions/${question._id}/answer`,
        { answer: draftAnswer.trim() }
      );
      setRoadmap(data.roadmap);
      setFeedbackMap(prev => ({ ...prev, [question._id]: data.feedback }));
      setOpenQuestionId(null);
      setDraftAnswer('');

      if (data.feedback.dayAutoCompleted) {
        toast.success(`Day ${day.day} completed! 🎉 +${data.feedback.pointsEarned} pts`);
      } else {
        toast.success(`Answer submitted! +${data.feedback.pointsEarned} pts`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmittingId(null);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
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

      {/* ── Header ── */}
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

      {/* ── Progress card ── */}
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
          {[
            { label: 'Weeks',         value: roadmap.durationWeeks,                                       color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { label: 'Completed',     value: roadmap.progress.completedTasks,                             color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Remaining',     value: roadmap.progress.totalTasks - roadmap.progress.completedTasks, color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Skills to Learn', value: roadmap.skillGapAnalysis?.length || 0,                    color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
          ].map(s => (
            <div key={s.label} className={`p-3 rounded-xl ${s.bg}`}>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Skill Gap ── */}
      {roadmap.skillGapAnalysis?.length > 0 && (
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{gap.currentLevel} → {gap.targetLevel}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  gap.priority === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                  gap.priority === 'high' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                  'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                }`}>{gap.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Weekly Plan ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Plan</h2>

        {roadmap.weeklyStructure?.map((week, weekIndex) => {
          const weekUnlocked = isWeekUnlocked(weekIndex);
          return (
            <motion.div key={week.week} initial={false} className="glass-card overflow-hidden">

              {/* Week header */}
              <button
                onClick={() => weekUnlocked && setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                className={`w-full p-6 flex items-center justify-between transition-all ${
                  weekUnlocked ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    week.completed
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : weekUnlocked
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {week.completed ? <CheckCircle2 className="w-5 h-5" /> : weekUnlocked ? `W${week.week}` : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Week {week.week}: {week.focus}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {week.days?.length || 0} days • {week.days?.filter((d: TaskDay) => d.completed).length || 0} completed
                      {!weekUnlocked && ' • Complete previous week first'}
                    </p>
                  </div>
                </div>
                {weekUnlocked && (
                  expandedWeek === week.week
                    ? <ChevronUp className="w-5 h-5 text-gray-400" />
                    : <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Days */}
              <AnimatePresence>
                {expandedWeek === week.week && weekUnlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-6 space-y-4 overflow-hidden"
                  >
                    {week.days?.map((day: TaskDay, dayIndex: number) => {
                      const unlocked = isDayUnlocked(week.days, dayIndex);
                      const allQAnswered = day.practiceQuestions?.every((q: PracticeQuestion) => q.answered) ?? false;

                      return (
                        <div key={day._id} className={`rounded-xl border transition-all ${
                          day.completed
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-500/5'
                            : unlocked
                              ? 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                              : 'border-gray-200/50 dark:border-gray-800/50 bg-gray-50/20 dark:bg-gray-900/20 opacity-60'
                        }`}>

                          {/* Day header */}
                          <div className="p-4 flex items-center gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {day.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              ) : !unlocked ? (
                                <Lock className="w-5 h-5 text-gray-400" />
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-400">{day.day}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold ${day.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                Day {day.day}: {day.title}
                                {!unlocked && <span className="ml-2 text-xs font-normal text-gray-400">(Complete Day {day.day - 1} first)</span>}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{day.description}</p>
                            </div>
                            {day.completed && (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                Done ✓
                              </span>
                            )}
                          </div>

                          {/* Day body — only if unlocked */}
                          {unlocked && (
                            <div className="px-4 pb-4 space-y-4">

                              {/* Topics */}
                              {day.topics?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {day.topics.map((topic, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Resources */}
                              {day.resources?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
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

                              {/* ── Practice Questions ── */}
                              {day.practiceQuestions?.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5" /> Practice Questions
                                    <span className="ml-auto text-[10px] font-normal normal-case">
                                      {day.practiceQuestions.filter((q: PracticeQuestion) => q.answered).length}/{day.practiceQuestions.length} answered
                                    </span>
                                  </p>

                                  {day.practiceQuestions.map((q: PracticeQuestion) => {
                                    const isOpen = openQuestionId === q._id;
                                    const fb = feedbackMap[q._id] || (q.answered && q.aiFeedback ? {
                                      score: q.score || 0,
                                      pointsEarned: q.score! >= 80 ? 15 : q.score! >= 60 ? 10 : q.score! >= 40 ? 5 : 2,
                                      dayAutoCompleted: false,
                                      idealAnswer: q.aiFeedback.idealAnswer,
                                      explanation: q.aiFeedback.explanation,
                                      keyPoints: q.aiFeedback.keyPoints,
                                    } as AiFeedback : null);

                                    return (
                                      <div key={q._id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">

                                        {/* Question row */}
                                        <div className="p-4">
                                          <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${difficultyStyle(q.difficulty)}`}>
                                                  {q.difficulty}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{q.type}</span>
                                                {q.answered && (
                                                  <span className={`text-[10px] font-bold ml-auto ${scoreColor(q.score || 0)}`}>
                                                    {q.score}/100
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{q.question}</p>
                                            </div>
                                            <div className="flex-shrink-0 ml-2">
                                              {q.answered ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    if (isOpen) { setOpenQuestionId(null); setDraftAnswer(''); }
                                                    else { setOpenQuestionId(q._id); setDraftAnswer(''); }
                                                  }}
                                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-all"
                                                >
                                                  {isOpen ? 'Cancel' : <><ChevronRight className="w-3.5 h-3.5" /> Answer</>}
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {/* Answer input */}
                                          <AnimatePresence>
                                            {isOpen && !q.answered && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden mt-3"
                                              >
                                                <textarea
                                                  value={draftAnswer}
                                                  onChange={e => setDraftAnswer(e.target.value)}
                                                  placeholder="Write your answer here... (min 10 characters)"
                                                  rows={5}
                                                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                                />
                                                <button
                                                  onClick={() => handleSubmitAnswer(day, q)}
                                                  disabled={!!submittingId}
                                                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-sm font-semibold transition-all disabled:opacity-60"
                                                >
                                                  {submittingId === q._id ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating with AI...</>
                                                  ) : (
                                                    <><Send className="w-4 h-4" /> Submit Answer</>
                                                  )}
                                                </button>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>

                                        {/* ── AI Feedback panel ── */}
                                        {q.answered && fb && (
                                          <div className="border-t border-gray-100 dark:border-gray-800">

                                            {/* Score banner */}
                                            <div className={`px-4 py-3 flex items-center justify-between ${
                                              fb.score >= 80 ? 'bg-emerald-50 dark:bg-emerald-500/10' :
                                              fb.score >= 60 ? 'bg-amber-50 dark:bg-amber-500/10' :
                                              'bg-red-50 dark:bg-red-500/10'
                                            }`}>
                                              <div className="flex items-center gap-2">
                                                <Star className={`w-4 h-4 ${scoreColor(fb.score)}`} />
                                                <span className={`text-sm font-bold ${scoreColor(fb.score)}`}>
                                                  {fb.score}/100 — {scoreLabel(fb.score)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-1 rounded-full">
                                                <Trophy className="w-3 h-3" />
                                                +{fb.pointsEarned} pts
                                              </div>
                                            </div>

                                            {/* Key points */}
                                            {fb.keyPoints?.length > 0 && (
                                              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Key Concepts
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {fb.keyPoints.map((kp, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                                                      {kp}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Ideal Answer */}
                                            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Perfect Answer
                                              </p>
                                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                {fb.idealAnswer}
                                              </p>
                                            </div>

                                            {/* Explanation */}
                                            {fb.explanation && (
                                              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-blue-50/40 dark:bg-blue-500/5">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                  <Lightbulb className="w-3.5 h-3.5 text-blue-500" /> Why This Works
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                  {fb.explanation}
                                                </p>
                                              </div>
                                            )}

                                            {/* Diagram / Visual */}
                                            {(fb as any).diagram && (
                                              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                  <Code2 className="w-3.5 h-3.5 text-emerald-500" /> Visual Breakdown
                                                </p>
                                                <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
                                                  {(fb as any).diagram}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* All answered banner */}
                                  {allQAnswered && day.completed && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                        All questions answered — Day {day.day} completed! 🎉
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
