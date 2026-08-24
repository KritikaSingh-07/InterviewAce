import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import {
  Route,
  Zap,
  Brain,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Loader2,
  Check,
  Wand2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import SkillTagInput from '../../components/ui/SkillTagInput';
import PlanUsageBanner from '../../components/billing/PlanUsageBanner';
import { usePlanUsage } from '../../hooks/usePlanUsage';

// Pre-generated particles for the AI generation overlay (stable, no re-render jitter)
const GEN_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: 3 + (i * 3.4) % 94,          // spread across full width
  delay: (i * 0.13) % 2.5,
  duration: 2.2 + (i * 0.17) % 2.8,
  size: 2 + (i * 0.37) % 3.5,
  color: [
    '#6366f1', '#8b5cf6', '#a855f7',
    '#ec4899', '#3b82f6', '#06b6d4', '#7c3aed',
  ][i % 7],
}));

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
  const [durationOpen, setDurationOpen] = useState(false);
  const durationRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    targetRole: '',
    careerBio: '',
    skills: [] as string[],
    duration: 4,
  });

  // Polish with AI state
  const [polishing, setPolishing] = useState(false);
  const [bioDisplayText, setBioDisplayText] = useState('');
  const [bioAnimating, setBioAnimating] = useState(false);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  // Thanos snap — per-character vaporize particles
  const [vaporChars, setVaporChars] = useState<
    { char: string; x: number; y: number; r: number; delay: number; id: number }[]
  >([]);
  const [showVapor, setShowVapor] = useState(false);

  // Delete roadmap state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  // Close duration dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (durationRef.current && !durationRef.current.contains(e.target as Node)) {
        setDurationOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const DURATION_OPTIONS = [2, 4, 6, 8, 12];

  // Polish bio with AI — Thanos snap vaporize + typewriter reveal
  const handlePolishBio = useCallback(async () => {
    if (!formData.careerBio.trim()) {
      toast.error('Write something in the bio first!');
      return;
    }
    setPolishing(true);
    setBioAnimating(true);

    const original = formData.careerBio;

    try {
      // Step 1: Build per-character vaporize particles
      const chars = original.split('').map((char, i) => ({
        id: i,
        char: char === ' ' ? '\u00A0' : char,
        x: (Math.random() - 0.5) * 220,
        y: -(Math.random() * 160 + 20),
        r: (Math.random() - 0.5) * 40,
        delay: Math.random() * 0.35,
      }));
      setVaporChars(chars);
      setShowVapor(true);

      // Wait for scatter to finish (~650ms)
      await new Promise((r) => setTimeout(r, 700));
      setShowVapor(false);
      setVaporChars([]);
      setFormData((prev) => ({ ...prev, careerBio: '' }));
      setBioDisplayText('');

      // Step 2: Call API while textarea is empty
      const { data } = await api.post('/roadmaps/polish-bio', { bio: original });
      const polished: string = data.polished || '';

      // Step 3: Typewriter reveal — char by char
      for (let i = 1; i <= polished.length; i++) {
        await new Promise((r) => setTimeout(r, 16));
        const partial = polished.slice(0, i);
        setBioDisplayText(partial);
        setFormData((prev) => ({ ...prev, careerBio: partial }));
      }

      toast.success('Bio polished! ✨');
    } catch {
      toast.error('Failed to polish bio. Try again.');
      setFormData((prev) => ({ ...prev, careerBio: original }));
    } finally {
      setPolishing(false);
      setBioAnimating(false);
      setShowVapor(false);
      setVaporChars([]);
      setBioDisplayText('');
    }
  }, [formData.careerBio]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmDeleteId !== id) {
      // First click — ask for confirmation
      setConfirmDeleteId(id);
      // Auto-reset after 3s if no second click
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    // Second click — actually delete
    setDeletingId(id);
    try {
      await api.delete(`/roadmaps/${id}`);
      setRoadmaps((prev) => prev.filter((r) => r._id !== id));
      toast.success('Roadmap deleted');
    } catch {
      toast.error('Failed to delete roadmap');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

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
        skills: formData.skills,
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
          className="glass-card p-6 overflow-visible relative"
        >
          {/* ✨ Grainy Rainbow Mesh Gradient Generation Overlay */}
          <AnimatePresence>
            {generating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10"
              >
                <style>{`
                  @keyframes rainbowSwirlA {
                    0%   { transform: rotate(0deg) translate(-5%, -5%) scale(1); }
                    50%  { transform: rotate(180deg) translate(8%, 10%) scale(1.2); }
                    100% { transform: rotate(360deg) translate(-5%, -5%) scale(1); }
                  }
                  @keyframes rainbowSwirlB {
                    0%   { transform: rotate(360deg) translate(10%, -8%) scale(1.1); }
                    50%  { transform: rotate(180deg) translate(-12%, 6%) scale(0.9); }
                    100% { transform: rotate(0deg) translate(10%, -8%) scale(1.1); }
                  }
                  @keyframes rainbowSwirlC {
                    0%   { transform: rotate(0deg) translate(-8%, 12%) scale(0.95); }
                    50%  { transform: rotate(-180deg) translate(14%, -10%) scale(1.25); }
                    100% { transform: rotate(-360deg) translate(-8%, 12%) scale(0.95); }
                  }
                  @keyframes noisePulse {
                    0%, 100% { opacity: 0.32; }
                    50%      { opacity: 0.48; }
                  }
                  @keyframes dottedMatrixPulse {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50%      { opacity: 0.4; transform: scale(1.02); }
                  }
                `}</style>

                {/* SVG Filter for genuine retro film grain noise */}
                <svg className="absolute w-0 h-0 pointer-events-none">
                  <filter id="grainyNoiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                </svg>

                {/* ── Dark Frosted Backdrop ── */}
                <div className="absolute inset-0" style={{ background: 'rgba(5, 4, 18, 0.68)' }} />

                {/* ── Organic Blended Rainbow Mesh Blobs ── */}

                {/* Blob 1: Electric Fuchsia & Pink */}
                <div style={{
                  position: 'absolute',
                  width: '75%', height: '85%',
                  top: '-30%', left: '-20%',
                  background: 'radial-gradient(circle, #f43f5e 0%, #e11d48 50%, transparent 80%)',
                  borderRadius: '45% 55% 60% 40%',
                  filter: 'blur(75px)',
                  opacity: 0.8,
                  animation: 'rainbowSwirlA 14s ease-in-out infinite',
                }} />

                {/* Blob 2: Ocean Cyan & Deep Blue */}
                <div style={{
                  position: 'absolute',
                  width: '70%', height: '75%',
                  bottom: '-25%', left: '-10%',
                  background: 'radial-gradient(circle, #06b6d4 0%, #2563eb 55%, transparent 80%)',
                  borderRadius: '55% 45% 35% 65%',
                  filter: 'blur(80px)',
                  opacity: 0.85,
                  animation: 'rainbowSwirlB 16s ease-in-out infinite',
                }} />

                {/* Blob 3: Vibrant Purple & Violet */}
                <div style={{
                  position: 'absolute',
                  width: '65%', height: '70%',
                  top: '-15%', right: '-15%',
                  background: 'radial-gradient(circle, #a855f7 0%, #7c3aed 50%, transparent 80%)',
                  borderRadius: '40% 60% 50% 50%',
                  filter: 'blur(70px)',
                  opacity: 0.8,
                  animation: 'rainbowSwirlC 12s ease-in-out infinite',
                }} />

                {/* Blob 4: Warm Sunset Gold & Amber Coral */}
                <div style={{
                  position: 'absolute',
                  width: '50%', height: '60%',
                  bottom: '-15%', right: '5%',
                  background: 'radial-gradient(circle, #fb923c 0%, #f59e0b 45%, transparent 75%)',
                  borderRadius: '60% 40% 55% 45%',
                  filter: 'blur(65px)',
                  opacity: 0.65,
                  animation: 'rainbowSwirlA 18s ease-in-out infinite reverse',
                }} />

                {/* Blob 5: Neon Emerald & Lime Highlight */}
                <div style={{
                  position: 'absolute',
                  width: '45%', height: '50%',
                  top: '25%', left: '25%',
                  background: 'radial-gradient(circle, #10b981 0%, #06b6d4 60%, transparent 80%)',
                  borderRadius: '50%',
                  filter: 'blur(60px)',
                  opacity: 0.55,
                  animation: 'rainbowSwirlB 10s ease-in-out infinite',
                }} />

                {/* ── Retro Film Grain Noise Overlay ── */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  filter: 'url(#grainyNoiseFilter)',
                  mixBlendMode: 'overlay',
                  animation: 'noisePulse 3s ease-in-out infinite',
                }} />

                {/* ── Retro Dotted Pattern Overlay ── */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.28) 1.2px, transparent 1.2px)',
                  backgroundSize: '18px 18px',
                  animation: 'dottedMatrixPulse 3.5s ease-in-out infinite',
                }} />

                {/* ── Soft Vignette & Border Glow ── */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '1rem',
                }} />
              </motion.div>
            )}
          </AnimatePresence>



          <form onSubmit={generateRoadmap} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 overflow-visible">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Target Job Role</label>
                <AutocompleteInput
                  value={formData.targetRole}
                  onChange={(val) => setFormData({ ...formData, targetRole: val })}
                  placeholder="e.g., Senior AI Engineer, Data Architect"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Career Bio / Summary</label>
                {/* Bio textarea with Polish AI button + Thanos snap overlay */}
                <div className="relative">
                  <textarea
                    ref={bioRef}
                    value={bioAnimating && !showVapor ? bioDisplayText : formData.careerBio}
                    onChange={(e) => {
                      if (!bioAnimating)
                        setFormData({ ...formData, careerBio: e.target.value });
                    }}
                    readOnly={bioAnimating}
                    className={`input-field h-24 resize-none w-full pr-12 transition-all duration-200 ${
                      showVapor ? 'opacity-0' : bioAnimating ? 'opacity-90 caret-transparent' : ''
                    }`}
                    placeholder="Tell us about your experience, current skills, and what you want to achieve..."
                  />

                  {/* Thanos snap vaporize overlay */}
                  <AnimatePresence>
                    {showVapor && (
                      <div
                        className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none z-20 p-3 text-sm leading-relaxed font-normal"
                        style={{ fontFamily: 'inherit', color: 'rgb(209,213,219)' }}
                      >
                        {vaporChars.map((c) => (
                          <motion.span
                            key={c.id}
                            initial={{ opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', rotate: 0 }}
                            animate={{
                              opacity: 0,
                              x: c.x,
                              y: c.y,
                              scale: 0.05,
                              filter: 'blur(3px)',
                              rotate: c.r,
                            }}
                            transition={{ duration: 0.5, delay: c.delay, ease: [0.4, 0, 1, 1] }}
                            style={{ display: 'inline', whiteSpace: 'pre' }}
                          >
                            {c.char}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Polish with AI circular button */}
                  <div className="absolute bottom-3 right-3">
                    <motion.button
                      type="button"
                      onClick={handlePolishBio}
                      disabled={polishing || bioAnimating}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      title="Polish with AI"
                      className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                        boxShadow: polishing
                          ? '0 0 16px rgba(139,92,246,0.8), 0 0 32px rgba(139,92,246,0.4)'
                          : '0 0 8px rgba(139,92,246,0.5)',
                      }}
                    >
                      {/* Spinning ring when active */}
                      {polishing && (
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-transparent"
                          style={{ borderTopColor: '#e9d5ff', borderRightColor: '#e9d5ff' }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      <motion.div
                        animate={polishing ? { rotate: [0, 15, -15, 0] } : {}}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        <Wand2 className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Tooltip label */}
                  {!polishing && (
                    <motion.div
                      initial={{ opacity: 0, x: 4 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="absolute bottom-3 right-12 pointer-events-none"
                    >
                      <span className="text-[10px] font-medium text-violet-400 whitespace-nowrap bg-gray-900/80 px-2 py-0.5 rounded-full border border-violet-500/30">
                        Polish with AI
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Core Skills</label>
                <SkillTagInput
                  skills={formData.skills}
                  onChange={(skills) => setFormData({ ...formData, skills })}
                  placeholder="+ Add skills (comma separated)"
                />
              </div>
              <div ref={durationRef} className="relative">
                <label className="block text-sm font-medium mb-2">Duration (weeks)</label>
                {/* Custom styled dropdown */}
                <button
                  type="button"
                  onClick={() => setDurationOpen((v) => !v)}
                  className="input-field w-full flex items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="font-medium">{formData.duration} WEEKS</span>
                  </span>
                  <motion.span animate={{ rotate: durationOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {durationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute z-[9999] w-full bottom-full mb-2 rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(15,15,35,0.98) 0%, rgba(30,20,60,0.98) 100%)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <div className="p-1">
                        {DURATION_OPTIONS.map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, duration: w });
                              setDurationOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-100 flex items-center justify-between group ${
                              formData.duration === w
                                ? 'bg-indigo-600/30 text-indigo-300'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                                  formData.duration === w ? 'bg-indigo-400' : 'bg-gray-600 group-hover:bg-indigo-500'
                                }`}
                              />
                              {w} weeks
                            </span>
                            {formData.duration === w && (
                              <Check className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
          <AnimatePresence mode="popLayout">
            {roadmaps.map((roadmap, i) => (
              <motion.div
                key={roadmap._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="relative group/card"
              >
                <Link
                  to={`/dashboard/roadmaps/${roadmap._id}`}
                  className="glass-card p-6 flex items-center gap-4 group"
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0">
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
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>

                {/* Delete button — top-right corner, no content overlap */}
                <div className="absolute top-3 right-3">
                  <motion.button
                    onClick={(e) => handleDelete(e, roadmap._id)}
                    disabled={deletingId === roadmap._id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200
                      opacity-0 group-hover/card:opacity-100
                      ${
                        confirmDeleteId === roadmap._id
                          ? 'bg-red-500/25 border border-red-500/70 text-red-400 !opacity-100 ring-2 ring-red-500/30'
                          : 'bg-black/30 border border-white/10 text-gray-500 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400'
                      }`}
                  >
                    {deletingId === roadmap._id ? (
                      <motion.span
                        className="w-3 h-3 border-2 border-red-400/40 border-t-red-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </motion.button>

                  {/* Confirm tooltip above the button */}
                  <AnimatePresence>
                    {confirmDeleteId === roadmap._id && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.9 }}
                        className="absolute top-9 right-0 pointer-events-none z-20"
                      >
                        <span className="text-[10px] font-semibold text-red-300 whitespace-nowrap bg-gray-950/95 px-2 py-1 rounded-lg border border-red-500/40 shadow-xl block">
                          ⚠ Confirm delete
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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

