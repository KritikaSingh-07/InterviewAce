import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  MotionConfig,
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  Volume2,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const EASE = [0.22, 1, 0.36, 1] as const;

const ROTATING_PHRASES = [
  'real-time AI feedback.',
  'live voice mock rounds.',
  'personalized roadmaps.',
  'instant score breakdowns.',
];

const INTERVIEW_PROMPTS = [
  {
    topic: 'System Design Mock',
    question: 'How would you handle cache invalidation across distributed data stores while maintaining consistency?',
  },
  {
    topic: 'DSA Round',
    question: 'Find the k-th smallest element in a BST. Can you do it in O(h + k) time?',
  },
  {
    topic: 'Behavioral Round',
    question: 'Tell me about a time you disagreed with a technical decision. How did you handle it?',
  },
];

const HEADLINE_LINES = [['Master', 'your', 'tech'], ['interviews', 'with']];

/* ── Small building blocks ─────────────────────────────────────────── */

function CountUp({ to, decimals = 0, suffix = '', delay = 0 }: { to: number; decimals?: number; suffix?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => `${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.8, delay, ease: EASE });
    return () => controls.stop();
  }, [inView, to, delay, value]);

  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Cycles through interview prompts with a typewriter effect. */
function useTypewriter(enabled: boolean) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [erasing, setErasing] = useState(false);
  const full = INTERVIEW_PROMPTS[index].question;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    if (!erasing) {
      timer = typed.length < full.length
        ? setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 26)
        : setTimeout(() => setErasing(true), 2800);
    } else if (typed.length > 0) {
      timer = setTimeout(() => setTyped(typed.slice(0, -1)), 10);
    } else {
      setIndex((i) => (i + 1) % INTERVIEW_PROMPTS.length);
      setErasing(false);
    }
    return () => clearTimeout(timer);
  }, [enabled, typed, erasing, full]);

  return { prompt: INTERVIEW_PROMPTS[index], typed: enabled ? typed : full, done: !enabled || (!erasing && typed === full) };
}

/** Card header + typewriter question. Kept separate so the per-keystroke
    state updates only re-render this small subtree. */
function InterviewConsole() {
  const reduceMotion = useReducedMotion() ?? false;
  const { prompt, typed, done } = useTypewriter(!reduceMotion);

  return (
    <>
      {/* Window bar */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 dark:text-violet-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={prompt.topic}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {prompt.topic}
                </motion.span>
              </AnimatePresence>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">Live</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Senior Software Engineer Role</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-700 dark:bg-violet-500" />
        </div>
      </div>

      {/* Typewriter question + equalizer */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-100 dark:border-gray-800 space-y-3 mb-5">
        <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-violet-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> AI Interviewer
          </span>
          <span className="tabular-nums">02:14</span>
        </div>
        <p className="min-h-[3.75rem] text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          “{typed}
          <span className={`inline-block w-[2px] h-[1em] align-[-0.15em] ml-0.5 bg-indigo-700 dark:bg-violet-400 ${done ? 'animate-pulse' : ''}`} />
          {done && '”'}
        </p>
        <div className="flex items-center justify-center gap-1 pt-1 h-6">
          {[40, 70, 35, 90, 60, 100, 50, 80, 45, 95, 60, 30, 75, 40, 65, 85].map((h, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: (h * 0.35) / 100 }}
              animate={{ scaleY: [(h * 0.35) / 100, h / 100, (h * 0.35) / 100] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
              className="w-1 h-full rounded-full bg-gradient-to-t from-indigo-800 to-violet-500 will-change-transform"
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────── */

export default function HeroSection() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const copyScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  // Pointer tracking: normalised (-0.5…0.5) for tilt/parallax, pixels for the spotlight
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const spring = { stiffness: 120, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), spring);
  const chipNearX = useSpring(useTransform(mx, [-0.5, 0.5], [-34, 34]), spring);
  const chipNearY = useSpring(useTransform(my, [-0.5, 0.5], [-24, 24]), spring);
  const chipFarX = useSpring(useTransform(mx, [-0.5, 0.5], [18, -18]), spring);
  const chipFarY = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), spring);
  const glowSpring = { stiffness: 90, damping: 22, mass: 0.6 };
  const glowX = useSpring(useTransform(spotX, (v) => v - 280), glowSpring);
  const glowY = useSpring(useTransform(spotY, (v) => v - 280), glowSpring);
  const glowOpacity = useSpring(0, { stiffness: 80, damping: 20 });

  const handlePointer = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
    spotX.set(e.clientX - r.left);
    spotY.set(e.clientY - r.top);
    glowOpacity.set(1);
  };
  const resetPointer = () => {
    mx.set(0);
    my.set(0);
    glowOpacity.set(0);
  };

  // Magnetic primary CTA
  const ctaX = useSpring(0, { stiffness: 220, damping: 14 });
  const ctaY = useSpring(0, { stiffness: 220, damping: 14 });
  const handleMagnet = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ctaX.set((e.clientX - (r.left + r.width / 2)) * 0.3);
    ctaY.set((e.clientY - (r.top + r.height / 2)) * 0.4);
  };

  // Rotating headline phrase
  const [phrase, setPhrase] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setPhrase((p) => (p + 1) % ROTATING_PHRASES.length), 3200);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={heroRef}
        onMouseMove={handlePointer}
        onMouseLeave={resetPointer}
        className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-28 pb-24 overflow-hidden"
      >
        {/* Ambient layers */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/25 via-violet-500/15 to-purple-500/20 rounded-full blur-[120px] animate-aurora" />
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 -z-10 h-[560px] w-[560px] rounded-full will-change-transform"
          style={{
            x: glowX,
            y: glowY,
            opacity: glowOpacity,
            background: 'radial-gradient(circle, rgb(var(--brand-2) / 0.16), transparent 65%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
            {/* ── Copy ── */}
            <motion.div style={{ opacity: copyOpacity, scale: copyScale }} className="lg:col-span-7 space-y-8 text-left">
              {/* Badge with shimmer */}
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="relative inline-flex items-center gap-2 overflow-hidden rounded-full glass pl-1.5 pr-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                <span className="rounded-full bg-indigo-900 dark:bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  New
                </span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-700 dark:text-violet-400" />
                AI interview coach with live voice
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 dark:via-white/15 to-transparent"
                  initial={{ x: '-150%' }}
                  animate={{ x: '350%' }}
                  transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut', delay: 1 }}
                />
              </motion.div>

              {/* Headline: word-by-word masked reveal + rotating phrase */}
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
                className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
              >
                {HEADLINE_LINES.map((line, li) => (
                  <span key={li} className="block">
                    {line.map((word) => (
                      <span key={word} className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em] mr-[0.25em]">
                        <motion.span
                          className="inline-block"
                          variants={{
                            hidden: { y: '110%', rotate: 6, opacity: 0 },
                            visible: { y: '0%', rotate: 0, opacity: 1, transition: { duration: 0.8, ease: EASE } },
                          }}
                        >
                          {word}
                        </motion.span>
                      </span>
                    ))}
                  </span>
                ))}

                {/* Grid-stacked so the line reserves the height of the longest phrase */}
                <span className="relative grid pb-3">
                  {ROTATING_PHRASES.map((p) => (
                    <span key={p} aria-hidden className="invisible [grid-area:1/1]">{p}</span>
                  ))}
                  <span className="sr-only">{ROTATING_PHRASES[0]}</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={phrase}
                      aria-hidden
                      className="relative [grid-area:1/1] self-start justify-self-start"
                      initial={{ y: '45%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1, transition: { duration: 0.7, ease: EASE, delay: phrase === 0 ? 0.45 : 0 } }}
                      exit={{ y: '-45%', opacity: 0, transition: { duration: 0.4, ease: [0.55, 0, 0.75, 0] } }}
                    >
                      <span className="gradient-text">{ROTATING_PHRASES[phrase]}</span>
                      <svg viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-3 left-0 w-full h-3 overflow-visible">
                        <motion.path
                          d="M3 10 C 70 3, 190 2, 297 8"
                          fill="none"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="stroke-indigo-800 dark:stroke-violet-500"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.9, ease: EASE, delay: phrase === 0 ? 0.9 : 0.35 }}
                        />
                      </svg>
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
                className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed"
              >
                Simulate realistic high-stakes technical & behavioral interviews. Receive instant role-specific evaluations, score breakdowns, and customized learning paths.
              </motion.p>

              {/* CTAs + social proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <motion.div
                    onMouseMove={handleMagnet}
                    onMouseLeave={() => { ctaX.set(0); ctaY.set(0); }}
                    style={{ x: ctaX, y: ctaY }}
                    className="relative"
                  >
                    {/* Pulsing halo */}
                    <span aria-hidden className="absolute inset-0 rounded-xl bg-indigo-700/25 dark:bg-violet-600/30 animate-ping [animation-duration:2.4s]" />
                    <button
                      onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                      className="btn-primary relative px-8 py-4 text-base flex items-center gap-2 group"
                    >
                      {isAuthenticated ? 'Go to Dashboard' : 'Start Free Practice'}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>

                  <button
                    onClick={() => navigate('/login')}
                    className="btn-secondary px-8 py-4 text-base flex items-center gap-3 group"
                  >
                    <span className="relative flex w-8 h-8 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-indigo-700/30 dark:bg-violet-500/30 animate-ping [animation-duration:2s]" />
                      <span className="relative w-8 h-8 rounded-full bg-gradient-to-br from-indigo-700 to-violet-600 text-white flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </span>
                    </span>
                    Watch Demo
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {['SC', 'JW', 'PP', 'AK'].map((initials, idx) => (
                      <motion.div
                        key={initials}
                        initial={{ opacity: 0, scale: 0.4, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.9 + idx * 0.08, type: 'spring', stiffness: 300, damping: 18 }}
                        whileHover={{ y: -4, scale: 1.12, zIndex: 10 }}
                        className={`w-9 h-9 rounded-full border-2 border-white dark:border-gray-950 flex items-center justify-center text-[10px] font-bold text-white shadow-md ${
                          ['bg-indigo-800', 'bg-violet-600', 'bg-purple-500', 'bg-gray-800'][idx]
                        }`}
                      >
                        {initials}
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0, rotate: -90 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: 1.1 + i * 0.07, type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </motion.span>
                      ))}
                    </div>
                    Joined by <span className="font-semibold text-gray-900 dark:text-white">10,000+</span> software engineers
                  </div>
                </div>
              </motion.div>

              {/* Count-up metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.85, ease: EASE }}
                className="pt-6 border-t border-gray-200/60 dark:border-gray-800/80 grid grid-cols-3 gap-6"
              >
                {[
                  { to: 93, suffix: '%', label: 'Offer Success Rate' },
                  { to: 50, suffix: 'k+', label: 'Interviews Completed' },
                  { to: 4.9, suffix: '/5', decimals: 1, label: 'User Rating' },
                ].map((m, i) => (
                  <div key={m.label} className="group">
                    <div className="text-2xl sm:text-3xl font-bold font-display text-gray-900 dark:text-white tabular-nums">
                      <CountUp to={m.to} suffix={m.suffix} decimals={m.decimals} delay={1 + i * 0.15} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</div>
                    <div className="mt-2 h-px w-6 bg-indigo-800 dark:bg-violet-500 transition-all duration-500 group-hover:w-16" />
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Interactive visual ── */}
            <motion.div style={{ y: visualY }} className="lg:col-span-5 relative">
              {/* Orbit rings */}
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] hidden md:block">
                <div className="absolute inset-0 rounded-full border border-dashed border-gray-300/70 dark:border-white/10 animate-[spin_50s_linear_infinite]">
                  <span className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-indigo-800 dark:bg-violet-500 shadow-[0_0_16px_rgb(var(--brand-2))]" />
                </div>
                <div className="absolute inset-16 rounded-full border border-gray-300/50 dark:border-white/[0.07] animate-[spin_36s_linear_infinite_reverse]">
                  <span className="absolute -bottom-1 left-1/3 w-2 h-2 rounded-full bg-purple-500" />
                  <span className="absolute top-1/4 -right-1 w-1.5 h-1.5 rounded-full bg-gray-400" />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 40, rotateX: 18, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: EASE }}
                style={{ transformPerspective: 1200 }}
              >
                <motion.div style={{ rotateX, rotateY, transformPerspective: 1200 }} className="relative will-change-transform">
                  {/* Glow */}
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-500 bg-[length:200%_200%] animate-gradient opacity-25 blur-2xl dark:opacity-40" />

                  {/* Card with travelling border beam */}
                  <div className="relative rounded-2xl p-px overflow-hidden shadow-2xl shadow-indigo-950/20 dark:shadow-black/60">
                    <div aria-hidden className="absolute inset-[-60%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,rgb(var(--brand-2))_310deg,#f5f8f6_340deg,transparent_360deg)]" />
                    <div className="absolute inset-0 rounded-2xl border border-gray-200/80 dark:border-white/[0.08]" />

                    <div className="relative rounded-[calc(0.875rem-1px)] bg-white dark:bg-gray-900 p-6">
                      <InterviewConsole />

                      {/* Live analysis */}
                      <div className="space-y-3">
                        <motion.div
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2, duration: 0.6, ease: EASE }}
                          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 flex items-start gap-3"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Strong Technical Precision</div>
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Accurately referenced write-through cache & pub/sub events.</div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.4, duration: 0.6, ease: EASE }}
                          className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 flex items-start gap-3"
                        >
                          <Zap className="w-4 h-4 text-indigo-700 dark:text-violet-400 shrink-0 mt-0.5" />
                          <div className="w-full">
                            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                              <span>Communication Score</span>
                              <span className="text-indigo-700 dark:text-violet-400 font-bold tabular-nums">
                                <CountUp to={94} suffix="%" delay={1.5} />
                              </span>
                            </div>
                            <div className="relative w-full h-1.5 bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full mt-1.5 overflow-hidden">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 0.94 }}
                                transition={{ duration: 1.8, delay: 1.5, ease: EASE }}
                                className="absolute inset-0 origin-left bg-gradient-to-r from-indigo-800 to-violet-500 rounded-full will-change-transform"
                              />
                              <div className="absolute inset-y-0 left-0 w-[94%] overflow-hidden rounded-full">
                                <motion.span
                                  className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                                  initial={{ x: '-2.5rem' }}
                                  animate={{ x: '24rem' }}
                                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.5, delay: 3.4, ease: 'easeInOut' }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Floating parallax chips */}
                  <motion.div style={{ x: chipNearX, y: chipNearY }} className="absolute -bottom-6 -left-6 sm:-left-10 z-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                      transition={{ opacity: { delay: 1.6 }, scale: { delay: 1.6, type: 'spring' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
                      className="flex items-center gap-3 rounded-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200/80 dark:border-white/10 px-4 py-2.5 shadow-xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-400">Growth</div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">+42% Confidence</div>
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.div style={{ x: chipFarX, y: chipFarY }} className="absolute -top-8 -right-4 sm:-right-8 z-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1, y: [0, 7, 0] }}
                      transition={{ opacity: { delay: 1.8 }, scale: { delay: 1.8, type: 'spring' }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
                      className="flex items-center gap-2.5 rounded-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200/80 dark:border-white/10 pl-2 pr-3.5 py-2 shadow-xl"
                    >
                      <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" className="stroke-gray-200 dark:stroke-gray-700" />
                        <motion.circle
                          cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" strokeLinecap="round"
                          className="stroke-indigo-800 dark:stroke-violet-500"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 0.92 }}
                          transition={{ delay: 2, duration: 1.6, ease: EASE }}
                        />
                      </svg>
                      <div>
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-400">Overall</div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                          <CountUp to={92} delay={2} />/100
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.div style={{ x: chipFarX, y: chipNearY }} className="absolute top-1/2 -left-8 sm:-left-14 z-10 hidden sm:block">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0, rotate: [-3, 3, -3] }}
                      transition={{ opacity: { delay: 2.1 }, x: { delay: 2.1, ease: EASE }, rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
                      className="flex items-center gap-1.5 rounded-lg bg-gray-950 dark:bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold text-gray-50 dark:text-gray-950 shadow-xl"
                    >
                      <Code2 className="w-3.5 h-3.5 text-violet-400 dark:text-indigo-700" />
                      O(log n) ✓
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>

      </section>
    </MotionConfig>
  );
}
