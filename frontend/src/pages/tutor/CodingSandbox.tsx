import ProblemStatement from '../../components/tutor/ProblemStatement';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Sparkles,
  Terminal,
  Play,
  RotateCcw,
  Send,
  HelpCircle,
  Code2,
  Cpu,
  ChevronLeft,
  Lock,
  AlertTriangle,
  Lightbulb,
  Settings,
  CheckCircle2,
  Trophy,
  Zap,
  X,
  Maximize2,
  Minimize2,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import MarkdownRenderer from '../../components/tutor/MarkdownRenderer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  templates: Record<string, string>;
  xpReward?: number;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface Session {
  code: string;
  language: string;
  stage: 'socratic' | 'hint' | 'solution' | 'post-solution';
  hintLevel: number;
  solutionUnlocked: boolean;
  status: 'not_started' | 'attempted' | 'solved';
  messages: Message[];
}

interface ExecutionResult {
  success: boolean;
  error?: string;
  results?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    stdout?: string;
  }>;
}

interface EditorPrefs {
  theme: string;
  fontSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  autoSave: boolean;
}

const DEFAULT_PREFS: EditorPrefs = {
  theme: 'vs-dark',
  fontSize: 14,
  wordWrap: 'off',
  minimap: false,
  autoSave: false,
};

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const MONACO_LANG: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rust',
};

const POST_SOLUTION_CHIPS = [
  'Common mistakes?',
  'Explain time complexity',
  'Alternative approaches?',
  'Follow-up questions?',
  'Next recommended problem?',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodingSandbox() {
  const { id } = useParams<{ id: string }>();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);

  // Console state
  const [consoleTab, setConsoleTab] = useState<'results' | 'stdout'>('results');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<ExecutionResult & { allPassed?: boolean; xpAwarded?: number } | null>(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [isUnlockingSolution, setIsUnlockingSolution] = useState(false);
  const [showSolutionConfirm, setShowSolutionConfirm] = useState(false);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);

  // Editor preferences
  const [prefs, setPrefs] = useState<EditorPrefs>(DEFAULT_PREFS);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const normalizedProblem = useMemo(() => {
    if (!problem) return null;
    return {
      description: problem.description,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      constraints: problem.constraints,
      examples: problem.examples || [],
      note: (problem as any).note || '',
    };
  }, [problem]);

  // ─── Fetch data ───────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const [probRes, sessionRes, prefRes] = await Promise.all([
          api.get(`/tutor/problems/${id}`),
          api.get(`/tutor/session/${id}`),
          api.get('/users/preferences').catch(() => ({ data: { preferences: DEFAULT_PREFS } })),
        ]);

        if (probRes.data.success) setProblem(probRes.data.problem);
        if (sessionRes.data.success) {
          const sess = sessionRes.data.session;
          setSession(sess);
          setCode(sess.code);
          setLanguage(sess.language);
        }
        if (prefRes.data.preferences) {
          setPrefs({ ...DEFAULT_PREFS, ...prefRes.data.preferences });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to load sandbox');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleResetCode = () => {
    if (!problem) return;
    setCode(problem.templates[language] || '');
    toast.success('Starter template restored');
  };

  const handleLanguageChange = async (newLang: string) => {
    if (!session || !problem) return;
    setLanguage(newLang);
    const template = problem.templates[newLang] || '';
    setCode(template);
    try {
      const { data } = await api.post(`/tutor/session/${id}/chat`, {
        message: `I switched my language to ${newLang.toUpperCase()}`,
        code: template,
        language: newLang,
      });
      if (data.success) setSession(data.session);
    } catch { /* silent */ }
  };

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    e?.preventDefault();
    const msg = customMsg || chatMessage;
    if (!msg.trim() || isSending || !session) return;
    setIsSending(true);
    if (!customMsg) setChatMessage('');
    try {
      const { data } = await api.post(`/tutor/session/${id}/chat`, { message: msg, code, language });
      if (data.success) setSession(data.session);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleImStuck = () => handleSendMessage(undefined, "I am stuck. Let's solve it together.");

  const handleGetHint = async () => {
    if (isGettingHint || !session) return;
    setIsGettingHint(true);
    try {
      const { data } = await api.post(`/tutor/session/${id}/hint`, { code, language });
      if (data.success) {
        setSession(data.session);
        toast.success(`Hint Level ${data.session.hintLevel} Unlocked!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to unlock hint');
    } finally {
      setIsGettingHint(false);
    }
  };

  const handleUnlockSolution = async () => {
    if (isUnlockingSolution || !session) return;
    setIsUnlockingSolution(true);
    setShowSolutionConfirm(false);
    try {
      const { data } = await api.post(`/tutor/session/${id}/solution`, { language });
      if (data.success) {
        setSession(data.session);
        toast.success('Complete Solution Unlocked!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to unlock solution');
    } finally {
      setIsUnlockingSolution(false);
    }
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunResult(null);
    setConsoleTab('results');
    try {
      const { data } = await api.post('/tutor/run', { problemId: id, code, language });
      if (data.success) setRunResult(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (isSubmitting || !session) return;
    setIsSubmitting(true);
    setRunResult(null);
    setConsoleTab('results');
    try {
      const { data } = await api.post(`/tutor/session/${id}/submit`, { code, language });
      if (data.success) {
        setSession(data.session);
        setRunResult(data);
        if (data.allPassed) {
          setEarnedXp(data.xpAwarded || 0);
          setShowXpPopup(true);
          setTimeout(() => setShowXpPopup(false), 4000);
          toast.success('All test cases passed! Problem Solved! 🎉');
        } else {
          toast.error('Some test cases failed. Keep going!');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePrefs = async (newPrefs: EditorPrefs) => {
    setPrefs(newPrefs);
    setShowPrefsModal(false);
    try {
      await api.put('/users/preferences', newPrefs);
      toast.success('Editor preferences saved!');
    } catch {
      // Silent — local state already updated
    }
  };

  // ─── Stage info ───────────────────────────────────────────────────────────

  const getStageInfo = () => {
    if (session?.solutionUnlocked || session?.stage === 'post-solution') {
      return {
        title: 'Post-Solution Mentorship',
        desc: 'Discuss alternative approaches and complexities.',
        gradient: 'from-violet-600 to-indigo-700',
        badge: 'POST-SOLUTION',
      };
    }
    if (session?.stage === 'hint') {
      return {
        title: `Hints — Level ${session.hintLevel}/2`,
        desc: 'Progressive conceptual hints unlocked.',
        gradient: 'from-amber-500 to-orange-600',
        badge: 'HINT MODE',
      };
    }
    return {
      title: 'Stage 1: Socratic Dialog',
      desc: 'Build your approach step-by-step.',
      gradient: 'from-emerald-500 to-teal-600',
      badge: 'SOCRATIC',
    };
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading || !problem || !session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading sandbox...</p>
        </div>
      </div>
    );
  }

  const stageInfo = getStageInfo();
  const isSolved = session.status === 'solved';

  const difficultyColors: Record<string, string> = {
    Easy: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    Medium: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    Hard: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} flex flex-col bg-gray-100 dark:bg-gray-950`}
      style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 72px)' }}
    >
      {/* ── XP Popup ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showXpPopup && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-2xl shadow-2xl shadow-amber-500/40"
          >
            <Trophy className="w-5 h-5" />
            <span className="font-extrabold text-sm">Problem Solved!</span>
            <div className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span className="font-bold text-sm">+{earnedXp} XP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global Top Bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 z-10">
        {/* Left: Back + Title + Difficulty */}
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <Link
              to="/dashboard/tutor"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            {problem.title}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${difficultyColors[problem.difficulty] || difficultyColors.Easy}`}>
              {problem.difficulty}
            </span>
            {isSolved && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" /> Solved
              </span>
            )}
          </h1>
        </div>

        {/* Center: Language selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">Language:</span>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPrefsModal(true)}
            title="Editor Settings"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen'}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── 3-Column Main Layout ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 gap-2 p-2">

        {/* ══ COLUMN 1: Problem Description ════════════════════════════════ */}
        <div className="flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
          style={{ width: '30%', minWidth: '260px', flexShrink: 0 }}
        >
          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-bold text-gray-800 dark:text-gray-200 tracking-wide">Problem Description</h2>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 text-sm scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
            {normalizedProblem && (
              <ProblemStatement {...normalizedProblem} />
            )}

            {/* Category tag */}
            {problem.category && (
              <div className="pt-5 border-t border-gray-100 dark:border-gray-800 mt-5">
                <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold rounded-full border border-indigo-100 dark:border-indigo-500/20">
                  {problem.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ══ COLUMN 2: Code Editor + Console ══════════════════════════════ */}
        <div className="flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-700/50 flex-1 min-w-0">

          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-950 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Mac-style dots */}
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1 rounded-md border border-gray-700/60">
                <Code2 className="w-3 h-3 text-indigo-400" />
                <span className="text-[11px] font-mono text-gray-400">editor.code</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCode}
                title="Reset to Template"
                className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {/* Run Code — prominent purple button matching screenshot */}
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : 'fill-white'}`} />
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              {/* Submit */}
              <button
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Monaco editor body */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={MONACO_LANG[language] || 'javascript'}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme={prefs.theme}
              options={{
                fontSize: prefs.fontSize,
                wordWrap: prefs.wordWrap,
                minimap: { enabled: prefs.minimap },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: 4,
                folding: true,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                fontLigatures: true,
                bracketPairColorization: { enabled: true },
                smoothScrolling: true,
              }}
            />
          </div>

          {/* ── Console / Test Results ─────────────────────────────────── */}
          <div className="h-44 bg-gray-950 border-t border-gray-800 flex flex-col flex-shrink-0">
            {/* Console tabs */}
            <div className="flex items-center justify-between px-4 bg-gray-900/80 border-b border-gray-800 flex-shrink-0">
              <div className="flex">
                {(['results', 'stdout'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setConsoleTab(tab)}
                    className={`py-2.5 px-4 text-[11px] font-semibold border-b-2 transition-all ${
                      consoleTab === tab
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    {tab === 'results' ? 'Test Case Results' : 'Console Output'}
                  </button>
                ))}
              </div>
              {runResult?.allPassed !== undefined && (
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  runResult.allPassed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                }`}>
                  {runResult.allPassed ? '✓ All Passed' : '✗ Failed'}
                </span>
              )}
            </div>

            {/* Console content */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-gray-300 min-h-0">
              {isRunning || isSubmitting ? (
                <div className="flex items-center gap-2.5 text-indigo-400 h-full justify-center">
                  <Terminal className="w-4 h-4 animate-pulse" />
                  <span className="text-[11px]">{isSubmitting ? 'Evaluating all test cases...' : 'Running code...'}</span>
                </div>
              ) : runResult ? (
                consoleTab === 'results' ? (
                  <div className="space-y-2">
                    {runResult.error ? (
                      <div className="flex gap-2 bg-rose-950/30 border border-rose-800/40 text-rose-400 p-3 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[10px] mb-1">Error:</p>
                          <pre className="whitespace-pre-wrap text-[11px]">{runResult.error}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                          <Cpu className="w-3 h-3" />
                          {runResult.results?.filter((r) => r.passed).length}/{runResult.results?.length} Tests Passed
                        </p>
                        {runResult.results?.map((res, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border ${
                              res.passed
                                ? 'bg-emerald-950/20 border-emerald-900/30'
                                : 'bg-rose-950/20 border-rose-900/30'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                              <span className={res.passed ? 'text-emerald-400' : 'text-rose-400'}>Case {i + 1}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] ${res.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {res.passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                              <div><span className="text-[9px] text-gray-600 block mb-0.5">Input</span><code className="text-gray-300">{JSON.stringify(res.input)}</code></div>
                              <div><span className="text-[9px] text-gray-600 block mb-0.5">Expected</span><code className="text-gray-300">{JSON.stringify(res.expected)}</code></div>
                            </div>
                            {!res.passed && (
                              <div className="text-[10px] mt-1.5">
                                <span className="text-[9px] text-rose-500/60 block mb-0.5">Your Output</span>
                                <code className="text-rose-300">{JSON.stringify(res.actual)}</code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {runResult.results?.some((r) => r.stdout) ? (
                      runResult.results.map((res, i) =>
                        res.stdout ? (
                          <div key={i} className="border-b border-gray-900 pb-2 mb-2 last:border-0">
                            <p className="text-[9px] text-indigo-400 mb-0.5">Case {i + 1} stdout:</p>
                            <pre className="text-gray-300 whitespace-pre-wrap text-[11px]">{res.stdout}</pre>
                          </div>
                        ) : null
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600 gap-2">
                        <Terminal className="w-4 h-4" />
                        <span className="text-[11px]">No console output</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                  <Terminal className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px]">Run your code to evaluate outputs against the test cases.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ COLUMN 3: AI Tutor ═══════════════════════════════════════════ */}
        <div
          className="relative flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
          style={{ width: '28%', minWidth: '260px', flexShrink: 0 }}
        >
          {/* Stage Header — gradient matching reference screenshot */}
          <div className={`bg-gradient-to-r ${stageInfo.gradient} flex-shrink-0 p-4`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold tracking-widest uppercase bg-black/20 text-white px-2.5 py-0.5 rounded-full">
                {stageInfo.badge}
              </span>
              <div className="flex items-center gap-1.5 text-white/90">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span className="text-[11px] font-bold">AI Tutor</span>
              </div>
            </div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">{stageInfo.title}</h3>
            <p className="text-[11px] text-white/75 mt-0.5 leading-relaxed">{stageInfo.desc}</p>
          </div>

          {/* Learning Controls */}
          <div className="bg-gray-50 dark:bg-gray-950 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2 items-center justify-between flex-shrink-0">
            <div className="flex gap-2 flex-wrap">
              {session.stage === 'socratic' && (
                <button
                  onClick={handleImStuck}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-[11px] shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  I am stuck
                </button>
              )}
              {(session.stage === 'socratic' || session.stage === 'hint') && !session.solutionUnlocked && (
                <button
                  onClick={session.hintLevel < 2 ? handleGetHint : () => setShowSolutionConfirm(true)}
                  disabled={isGettingHint || isSending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {isGettingHint
                    ? 'Unlocking...'
                    : session.hintLevel < 2
                      ? `Hint ${session.hintLevel + 1}/2`
                      : 'Show Solution'}
                </button>
              )}
            </div>
            {!session.solutionUnlocked && (
              <button
                onClick={() => setShowSolutionConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg font-bold text-[11px] transition-all active:scale-95"
              >
                <Lock className="w-3 h-3" />
                Show Solution
              </button>
            )}
          </div>

          {/* Solution confirm banner */}
          <AnimatePresence>
            {showSolutionConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 px-4 py-3 text-xs flex-shrink-0 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Unlock complete solution?
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-3 text-[11px] leading-relaxed">
                  This reveals the optimized code. Try the Socratic dialogue first for deeper learning.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowSolutionConfirm(false)}
                    className="px-3 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold text-[11px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnlockSolution}
                    disabled={isUnlockingSolution}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] shadow-sm disabled:opacity-50 transition-all"
                  >
                    {isUnlockingSolution ? 'Unlocking...' : 'Reveal Solution'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-gray-50/50 dark:bg-gray-950/50">
            {session.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed">
                  Share your approach to get started with the AI tutor.
                </p>
              </div>
            )}
            {session.messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed max-w-[90%] shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-150 dark:border-gray-800'
                    }`}
                  >
                    {isUser ? (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 px-1 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-start">
                <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Post-solution quick chips */}
          {session.solutionUnlocked && (
            <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5 flex-shrink-0">
              {POST_SOLUTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(undefined, chip)}
                  disabled={isSending}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-950/50 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 text-[10px] font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-all disabled:opacity-50 active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Chat input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={
                session.stage === 'post-solution' || session.solutionUnlocked
                  ? 'Ask tutor follow-ups or queries...'
                  : 'Share your approach...'
              }
              disabled={isSending}
              className="flex-1 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 placeholder-gray-400 dark:placeholder-gray-600 transition-all"
            />
            <button
              type="submit"
              disabled={isSending || !chatMessage.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm active:scale-95"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Editor Preferences Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showPrefsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPrefsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  Editor Settings
                </h3>
                <button
                  onClick={() => setShowPrefsModal(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <PrefsForm prefs={prefs} onSave={handleSavePrefs} onCancel={() => setShowPrefsModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Preferences Form ─────────────────────────────────────────────────────────

function PrefsForm({ prefs, onSave, onCancel }: { prefs: EditorPrefs; onSave: (p: EditorPrefs) => void; onCancel: () => void }) {
  const [local, setLocal] = useState<EditorPrefs>({ ...prefs });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Theme</label>
        <select
          value={local.theme}
          onChange={(e) => setLocal((p) => ({ ...p, theme: e.target.value }))}
          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="vs-dark">VS Dark</option>
          <option value="vs-light">VS Light</option>
          <option value="hc-black">High Contrast Black</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          Font Size: <span className="text-indigo-500">{local.fontSize}px</span>
        </label>
        <input
          type="range"
          min={10}
          max={20}
          value={local.fontSize}
          onChange={(e) => setLocal((p) => ({ ...p, fontSize: Number(e.target.value) }))}
          className="w-full accent-indigo-600"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Word Wrap</label>
        <button
          onClick={() => setLocal((p) => ({ ...p, wordWrap: p.wordWrap === 'on' ? 'off' : 'on' }))}
          className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${local.wordWrap === 'on' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${local.wordWrap === 'on' ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Minimap</label>
        <button
          onClick={() => setLocal((p) => ({ ...p, minimap: !p.minimap }))}
          className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${local.minimap ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${local.minimap ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(local)}
          className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
