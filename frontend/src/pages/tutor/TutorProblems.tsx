import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Terminal,
  Code2,
  ChevronRight,
  CheckCircle2,
  Clock,
  BookmarkCheck,
  Bookmark,
  Circle,
  Search,
  Filter,
  Trophy,
  Zap,
  Building2,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  description: string;
  acceptanceRate?: string;
  companyTags?: string[];
  xpReward?: number;
  estimatedTime?: string;
  codeforcesUrl?: string;
  status?: 'not_started' | 'attempted' | 'solved';
  isBookmarked?: boolean;
}

const DIFFICULTY_FILTERS = ['All', 'Easy', 'Medium', 'Hard'];
const STATUS_FILTERS = ['All', 'Not Started', 'Attempted', 'Solved', 'Bookmarked'];

interface TopicSummary { topic: string; total: number; difficulties: Record<string, number> }
interface Pagination { total: number; hasNextPage: boolean }

export default function TutorProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, hasNextPage: false });
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null);
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchFilters(); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => fetchProblems(1, false), searchQuery ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [selectedTopic, selectedDifficulty, selectedStatus, selectedCompany, searchQuery]);

  const fetchFilters = async () => {
    try {
      const { data } = await api.get('/tutor/problems/filters');
      if (data.success) { setTopics(data.topics); setCompanies(data.companies); }
    } catch { toast.error('Failed to load problem filters'); }
  };

  const fetchProblems = async (page = 1, append = false) => {
    setLoading(true);
    try {
      const { data } = await api.get('/tutor/problems', { params: { page, limit: 20, topic: selectedTopic, difficulty: selectedDifficulty, status: selectedStatus, company: selectedCompany, search: searchQuery } });
      if (data.success) {
        setProblems((previous) => append ? [...previous, ...data.problems] : data.problems);
        setPagination(data.pagination);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation();
    if (bookmarkLoading) return;
    setBookmarkLoading(problemId);
    try {
      const { data } = await api.post(`/tutor/session/${problemId}/bookmark`);
      if (data.success) {
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, isBookmarked: data.isBookmarked } : p))
        );
        toast.success(data.isBookmarked ? 'Problem bookmarked' : 'Bookmark removed');
      }
    } catch (error: any) {
      toast.error('Failed to update bookmark');
    } finally {
      setBookmarkLoading(null);
    }
  };

  const stats = {
    total: pagination.total,
    solved: problems.filter((p) => p.status === 'solved').length,
    attempted: problems.filter((p) => p.status === 'attempted').length,
    bookmarked: problems.filter((p) => p.isBookmarked).length,
  };

  const getDifficultyStyle = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20';
      case 'medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20';
      case 'hard': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-500/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'solved': return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'attempted': return <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      default: return <Circle className="w-5 h-5 text-gray-300 dark:text-gray-700 flex-shrink-0 hover:text-indigo-400 transition-colors" />;
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

      {/* ══ Hero Banner ══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-8 sm:p-10 text-white shadow-2xl shadow-indigo-500/20"
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              Interactive DSA Mentor
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">AI Coding Tutor</h1>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              Step into our sandbox to practice coding with a dedicated Socratic coach.
              Instead of giving away answers, our tutor guides you concept-by-concept, provides progressive hints, and reviews your code logic.
            </p>
          </div>

          {/* Glassmorphism Stats Cards */}
          <div className="flex gap-4 flex-wrap w-full lg:w-auto">
            {[
              { label: 'Solved', value: stats.solved, icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-300' },
              { label: 'Attempted', value: stats.attempted, icon: <Zap className="w-5 h-5" />, color: 'text-amber-300' },
              { label: 'Available', value: stats.total, icon: <Code2 className="w-5 h-5" />, color: 'text-blue-300' },
            ].map(({ label, value, icon, color }) => (
              <div
                key={label}
                className="flex-1 lg:flex-initial flex items-center gap-3 px-5 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 min-w-[120px] transition-transform hover:scale-105 duration-300"
              >
                <div className={`p-2.5 rounded-xl bg-white/10 ${color}`}>
                  {icon}
                </div>
                <div>
                  <span className="text-2xl font-black block tracking-tight leading-none">{value}</span>
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider mt-1 block">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══ Search & Filtering Bar ═════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search problems by name, description, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-850 rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-250 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Toggle advance filters */}
          <button
            onClick={() => setShowAdvanceFilters((v) => !v)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              showAdvanceFilters
                ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Topic tags row */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block px-1">Filter by Topic</label>
          <div className="flex flex-wrap gap-2">
            {['All', ...topics.map((item) => item.topic)].map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${
                  selectedTopic === topic
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-800 hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {topic} {topic !== 'All' && <span className={`ml-1 text-[9px] ${selectedTopic === topic ? 'text-indigo-200' : 'text-gray-400'}`}>({topics.find((item) => item.topic === topic)?.total || 0})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Advance Filters */}
        <AnimatePresence>
          {showAdvanceFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2 border-t border-gray-100 dark:border-gray-850"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 block px-1">Difficulty</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DIFFICULTY_FILTERS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDifficulty(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          selectedDifficulty === d
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-gray-250/40 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 block px-1">Status</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_FILTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          selectedStatus === s
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-gray-250/40 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Companies */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 block px-1">Company Target</label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border bg-gray-50 dark:bg-gray-950 text-gray-750 dark:text-gray-305 border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="All">All companies</option>
                    {companies.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ Results Count & Progress ═══════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
          Showing <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{problems.length}</span> of{' '}
          <span className="text-gray-800 dark:text-gray-200 font-extrabold">{stats.total}</span> problems
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-450 dark:text-gray-500 font-bold">
          <BarChart3 className="w-4 h-4 text-indigo-550" />
          <span>
            Solve Progress: {Math.round((stats.solved / Math.max(stats.total, 1)) * 100)}%
          </span>
        </div>
      </div>

      {/* ══ Problems List Table/Cards ══════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-900 border border-gray-250/60 dark:border-gray-800/80 rounded-2xl overflow-hidden shadow-sm">

        {/* Table Header — hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 items-center px-6 py-3.5 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-500">
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-5">Problem</div>
          <div className="col-span-2">Topic</div>
          <div className="col-span-1 text-center">Diff.</div>
          <div className="col-span-1 text-center">Accept.</div>
          <div className="col-span-1 text-center">XP Reward</div>
          <div className="col-span-1 text-right pr-2">Save</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-full">
                <Terminal className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No problems found</p>
                <p className="text-xs text-gray-550 dark:text-gray-500">Try matching different search terms or clearing your filters</p>
              </div>
              <button
                onClick={() => { setSelectedTopic('All'); setSelectedDifficulty('All'); setSelectedStatus('All'); setSelectedCompany('All'); setSearchQuery(''); }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-100 dark:border-indigo-950"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            problems.map((prob) => (
              <div
                key={prob.id}
                onClick={() => navigate(`/dashboard/tutor/${prob.id}`)}
                className={`grid grid-cols-12 items-center px-4 sm:px-6 py-4 cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-950/15 transition-all group duration-200 ${
                  prob.status === 'solved' ? 'bg-emerald-50/10 dark:bg-emerald-950/5' : ''
                }`}
              >
                {/* 1. Status icon (Center aligned) */}
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  {getStatusIcon(prob.status)}
                </div>

                {/* 2. Problem Title + company tags + Mobile indicators */}
                <div className="col-span-8 md:col-span-5 flex flex-col gap-1 min-w-0 pr-2">
                  <span className={`text-xs sm:text-sm font-bold truncate group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors duration-250 ${
                    prob.status === 'solved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {prob.title}
                  </span>

                  {/* Badges/Tags Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {/* Difficulty on mobile */}
                    <span className={`md:hidden px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wide ${getDifficultyStyle(prob.difficulty)}`}>
                      {prob.difficulty}
                    </span>

                    {/* Topic tag on mobile */}
                    <span className="md:hidden text-[9px] font-bold text-gray-500 bg-gray-55/40 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {prob.category}
                    </span>

                    {/* Company tags */}
                    {prob.companyTags && prob.companyTags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5 text-gray-450 dark:text-gray-500 flex-shrink-0" />
                        {prob.companyTags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[9px] font-bold text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/80 px-1.5 py-0.5 rounded-full border border-gray-150/40 dark:border-gray-700/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Category (Topic) — hidden on mobile */}
                <div className="hidden md:col-span-2 md:block">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 truncate block">{prob.category}</span>
                </div>

                {/* 4. Difficulty — hidden on mobile */}
                <div className="hidden md:col-span-1 md:flex justify-center">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wide ${getDifficultyStyle(prob.difficulty)}`}>
                    {prob.difficulty}
                  </span>
                </div>

                {/* 5. Acceptance rate — hidden on mobile */}
                <div className="hidden md:col-span-1 md:block text-center">
                  <span className="text-xs font-mono font-bold text-gray-450 dark:text-gray-500">{prob.acceptanceRate || '—'}</span>
                </div>

                {/* 6. XP reward */}
                <div className="col-span-1 text-center flex justify-center">
                  {prob.xpReward ? (
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-500/10 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 fill-indigo-500" />
                      +{prob.xpReward}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">—</span>
                  )}
                </div>

                {/* 7. Save bookmark button */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={(e) => handleBookmark(e, prob.id)}
                    disabled={bookmarkLoading === prob.id}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      prob.isBookmarked
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                        : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    } ${bookmarkLoading === prob.id ? 'opacity-40 cursor-wait' : ''}`}
                    title={prob.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {prob.isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchProblems(Math.ceil(problems.length / 20) + 1, true)}
            className="px-5 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all shadow-sm active:scale-95"
          >
            Load More Problems
          </button>
        </div>
      )}

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center pt-2"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <ChevronRight className="w-4 h-4" />
          Select a problem to start learning interactively with your AI Socratic Tutor
        </div>
      </motion.div>
    </div>
  );
}
