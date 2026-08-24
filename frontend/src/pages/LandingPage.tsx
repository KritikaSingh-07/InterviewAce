import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import PricingCards from '../components/pricing/PricingCards';
import {
  Sparkles,
  Target,
  Brain,
  Trophy,
  BarChart3,
  ArrowRight,
  Star,
  ChevronDown,
  Sun,
  Moon,
  Bot,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  Play,
  Cpu,
  Building2,
  TrendingUp,
  Check,
  X,
  Sparkle,
  Terminal,
  Award,
} from 'lucide-react';

// --- Framer Motion Animation Variants ---
const fadeInUp = {
  initial: { opacity: 0, y: 35 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.12 } },
  viewport: { once: true },
};

const floatAnimation = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut',
    },
  },
};

export default function LandingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'interview' | 'analytics' | 'roadmap'>('interview');

  const { isAuthenticated } = useAuthStore();
  const { isDarkMode, toggle } = useThemeStore();
  const navigate = useNavigate();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.94]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, 50]);

  const companies = [
    { name: 'Google', symbol: 'G' },
    { name: 'Meta', symbol: 'M' },
    { name: 'Amazon', symbol: 'A' },
    { name: 'Microsoft', symbol: 'MS' },
    { name: 'Apple', symbol: '' },
    { name: 'Netflix', symbol: 'N' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'Adaptive AI Mock Interviews',
      description: 'Engage with an AI interviewer that dynamically tailors technical, behavioral, and system design questions based on your live responses.',
      color: 'from-indigo-500 via-purple-500 to-violet-600',
      tag: 'Real-time NLP',
    },
    {
      icon: Target,
      title: 'Hyper-Personalized Roadmaps',
      description: 'Receive custom learning paths mapped against your current skill gap, targeted job descriptions, and timeline.',
      color: 'from-emerald-400 via-teal-500 to-cyan-600',
      tag: 'Skill AI',
    },
    {
      icon: BarChart3,
      title: 'Deep Analytics & Feedback',
      description: 'Granular scoring on answer quality, pacing, communication clarity, and technical accuracy with line-by-line breakdown.',
      color: 'from-amber-400 via-orange-500 to-rose-600',
      tag: 'Speech & Logic',
    },
    {
      icon: Trophy,
      title: 'Global Leaderboard & Badges',
      description: 'Compete in weekly coding & interview sprints. Earn verified skill credentials to showcase directly on your resume.',
      color: 'from-blue-500 via-indigo-500 to-purple-600',
      tag: 'Gamified',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Candidates', trend: '+12% this month' },
    { value: '93%', label: 'Offer Success Rate', trend: 'Top 1% Tier' },
    { value: '50,000+', label: 'Interviews Simulated', trend: '24/7 AI Engine' },
    { value: '4.9/5', label: 'Candidate Rating', trend: '2,500+ Reviews' },
  ];

  const comparisonData = [
    { feature: 'Real-time Voice & Video AI Evaluation', us: true, traditional: false },
    { feature: 'Instant Line-by-Line Code & Answer Analysis', us: true, traditional: false },
    { feature: 'Dynamic Role-Specific Question Generation', us: true, traditional: 'Static Questions' },
    { feature: 'Personalized Skill Gap Roadmaps', us: true, traditional: false },
    { feature: '24/7 Availability Without Booking Ahead', us: true, traditional: false },
    { feature: 'Cost per Session', us: '$0 Free Tier', traditional: '$150-$300/hr' },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'L5 Software Engineer at Google',
      avatar: 'SC',
      content: 'InterviewAce felt like having a senior staff engineer conducting my practice sessions. The real-time speech and technical feedback pinpointed my exact weak spots.',
      rating: 5,
      company: 'Google',
    },
    {
      name: 'James Wilson',
      role: 'Senior Frontend Engineer at Meta',
      avatar: 'JW',
      content: 'The custom roadmaps saved me weeks of aimless study. I went from failing system design rounds to getting an offer in just 20 days.',
      rating: 5,
      company: 'Meta',
    },
    {
      name: 'Priya Patel',
      role: 'Data Scientist at Amazon',
      avatar: 'PP',
      content: 'The AI adaptively increased difficulty as I answered correctly. By the time I took my real Amazon loop, it felt like second nature!',
      rating: 5,
      company: 'Amazon',
    },
  ];

  const faqs = [
    {
      question: 'What makes InterviewAce different from LeetCode or YouTube guides?',
      answer: 'Unlike static problem lists or videos, InterviewAce provides a dynamic, two-way interactive interview. It speaks to you, evaluates your vocal pacing, assesses technical accuracy in real time, and adapts questions dynamically based on how well you respond.',
    },
    {
      question: 'Is there a free tier available?',
      answer: 'Yes! Our free tier provides full access to practice mock sessions, AI scorecard summaries, personalized roadmap generators, and public leaderboard rankings.',
    },
    {
      question: 'How does the AI evaluate my technical and behavioral answers?',
      answer: 'We use multi-modal LLM models trained on thousands of successful tech interviews from FAANG/MAANG companies. It evaluates technical accuracy, STAR-method adherence for behavioral questions, concise communication, and problem-solving structure.',
    },
    {
      question: 'Can I target specific tech stacks and job positions?',
      answer: 'Absolutely. You can select target roles like Frontend Developer, Backend Engineer, System Architect, Data Scientist, Product Manager, or upload a custom Job Description to match the exact requirements.',
    },
    {
      question: 'Can I edit my profile and details later?',
      answer: 'Yes, you can manage your target roles, preferred difficulty, and user profile anytime from your dedicated account settings dashboard.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-x-hidden">

      {/* Dynamic Background Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-gradient-to-br from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] bg-gradient-to-tl from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[55vw] h-[55vw] bg-gradient-to-tr from-violet-600/15 via-indigo-500/10 to-transparent rounded-full blur-[140px]" />
      </div>

      {/* Header / Dynamic Glass Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-gray-200/80 dark:border-gray-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-gray-250 rounded-[11px] flex items-center justify-center">
                  <Sparkle className="w-5 h-5 text-white fill-indigo-400 animate-spin-slow" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-600 dark:from-white dark:via-gray-100 dark:to-indigo-400">
                Interview<span className="text-indigo-600 dark:text-indigo-400">Ace</span>
              </span>
            </Link>

            {/* Nav Menu Items */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
              <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How it Works</a>
              <a href="#comparison" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Why Us</a>
              <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggle}
                aria-label="Toggle dark mode"
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200/60 dark:border-gray-800 transition-all hover:scale-105 active:scale-95"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="relative inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    <span>Get Started Free</span>
                    <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden z-10">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold mb-8 shadow-sm backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Next-Gen AI Interview Prep 2.0</span>
            <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">New</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8"
          >
            Practice Realistic AI Mock
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400">
              Interviews. Land Top Offers.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Master technical code rounds, system design, and behavioral questions with an adaptive AI interviewer. Get instant vocal & analytical feedback tailored to your target company.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-16"
          >
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 group"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Free AI Mock Session'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#demo-preview"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4 fill-current text-indigo-600 dark:text-indigo-400" />
              <span>Watch Live Demo</span>
            </a>
          </motion.div>

          {/* Floating Feature Badges / Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 shadow-lg shadow-gray-200/20 dark:shadow-none hover:border-indigo-500/50 transition-colors group"
              >
                <div className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-1 group-hover:scale-105 transition-transform">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">{stat.label}</div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">{stat.trend}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-12 flex justify-center"
        >
          <ChevronDown className="w-6 h-6 text-gray-400 dark:text-gray-600" />
        </motion.div>
      </section>

      {/* LOGO MARQUEE / SOCIAL PROOF */}
      <section className="py-10 border-y border-gray-200/80 dark:border-gray-800/80 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">
            Trusted by candidates who landed offers at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-75 dark:opacity-80">
            {companies.map((comp) => (
              <div key={comp.name} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-default">
                <span className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-black">
                  {comp.symbol}
                </span>
                <span>{comp.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO PREVIEW CONSOLE */}
      <section id="demo-preview" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Experience the <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">AI Interview Cockpit</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
              Real-time voice synthesis, adaptive question complexity, and instant AI answer scorecards.
            </p>
          </motion.div>

          {/* Interactive Console UI Mockup */}
          <motion.div
            {...fadeInUp}
            className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-900 text-white shadow-2xl shadow-indigo-500/10 overflow-hidden"
          >
            {/* Top Bar */}
            <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  interview-ace-session-v2.8.live
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('interview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'interview' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                >
                  Live Interview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                >
                  AI Feedback Scorecard
                </button>
              </div>
            </div>

            {/* Console Body */}
            <div className="p-6 sm:p-8 min-h-[380px] flex flex-col justify-between bg-gradient-to-b from-gray-900 to-gray-950">
              {activeTab === 'interview' ? (
                <div className="space-y-6">
                  {/* AI Question Box */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                        <span>AI Interviewer</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>System Design Round</span>
                      </div>
                      <p className="text-sm sm:text-base font-medium text-gray-200">
                        "Can you explain how you would design a distributed key-value store to handle 100,000 writes per second with high availability?"
                      </p>
                    </div>
                  </div>

                  {/* Candidate Vocal / Text Input Simulation */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50 ml-6 sm:ml-12">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                        <span>Candidate Answer (Voice Stream)</span>
                        <span className="text-emerald-400 font-semibold">98% Clarity</span>
                      </div>
                      <p className="text-sm text-gray-300 italic">
                        "I would start by implementing consistent hashing to partition data evenly across nodes, combined with quorum-based replication for consistency..."
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Analytics Preview */
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/60">
                    <div className="text-xs font-bold text-gray-400 mb-1">Technical Accuracy</div>
                    <div className="text-2xl font-black text-emerald-400">92 / 100</div>
                    <p className="text-xs text-gray-400 mt-2">Strong grasp of partitioning & hashing logic.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/60">
                    <div className="text-xs font-bold text-gray-400 mb-1">Communication Pacing</div>
                    <div className="text-2xl font-black text-indigo-400">145 WPM</div>
                    <p className="text-xs text-gray-400 mt-2">Optimal delivery speed, clear STAR structure.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/60">
                    <div className="text-xs font-bold text-gray-400 mb-1">Skill Gap Suggestion</div>
                    <div className="text-sm font-bold text-amber-400 mt-1">Review Quorum Read/Write</div>
                    <p className="text-xs text-gray-400 mt-2">Deep dive suggested in personalized roadmap.</p>
                  </div>
                </div>
              )}

              {/* Console Action Footer */}
              <div className="pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-gray-400">AI Assistant Ready & Listening</span>
                </div>
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide uppercase transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  Try Full Live Mock
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Unfair Advantage
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white mt-2 mb-4">
              Everything You Need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Succeed</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Purpose-built AI tools to transform interview anxiety into confident offers.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={{
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 },
                }}
                className="relative group p-8 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800/80 shadow-xl shadow-gray-200/40 dark:shadow-none hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-3.5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-full h-full text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Explore Feature</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 bg-gray-100/60 dark:bg-gray-900/40 border-y border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Simple 3-Step System
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mt-2 mb-4">
              How It <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Works</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started in under 2 minutes and see actionable improvements after your very first mock session.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Set Target Role',
                desc: 'Pick your role (e.g. Frontend, Fullstack, AI) and target tier company. Custom job descriptions supported.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Conduct AI Mock Round',
                desc: 'Answer live technical & behavioral questions. Experience dynamic voice/video prompts with zero scheduling lag.',
                icon: Bot,
              },
              {
                step: '03',
                title: 'Execute & Improve',
                desc: 'Review your detailed scorecard, fix technical gaps via custom roadmaps, and climb the global rankings.',
                icon: BarChart3,
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 shadow-lg shadow-gray-200/30 dark:shadow-none text-center group hover:border-indigo-500/50 transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON MATRIX SECTION */}
      <section id="comparison" className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">InterviewAce</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Compare us against traditional peer mock services and static practice sites.
            </p>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                    <th className="p-5 text-sm font-bold text-gray-900 dark:text-white">Feature</th>
                    <th className="p-5 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30">InterviewAce AI</th>
                    <th className="p-5 text-sm font-bold text-gray-500 dark:text-gray-400">Traditional Peer Prep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-5 font-medium text-gray-800 dark:text-gray-200">{row.feature}</td>
                      <td className="p-5 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20">
                        {typeof row.us === 'boolean' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-5 h-5 stroke-[3]" />
                            <span>Included</span>
                          </div>
                        ) : (
                          row.us
                        )}
                      </td>
                      <td className="p-5 text-gray-500 dark:text-gray-400">
                        {typeof row.traditional === 'boolean' ? (
                          row.traditional ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-rose-500">
                              <X className="w-5 h-5" />
                              <span>No</span>
                            </div>
                          )
                        ) : (
                          row.traditional
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-24 bg-gray-100/60 dark:bg-gray-900/40 border-y border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Real Stories. <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Real Offers.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See how our candidates aced their technical and behavioral interviews.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 shadow-lg shadow-gray-200/30 dark:shadow-none flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                      {testimonial.company}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6 italic">
                    "{testimonial.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{testimonial.name}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Simple, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Transparent</span> Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Invest in your career. Upgrade or cancel anytime with a 100% satisfaction guarantee.
            </p>
          </motion.div>

          {/* Render Existing Dynamic Component */}
          <PricingCards />
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/30 overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-grid-white/10 pointer-events-none" />
            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight relative z-10">
              Ready to Land Your Next Big Offer?
            </h2>
            <p className="text-base sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-10 relative z-10 font-normal">
              Join thousands of students and engineers who transformed their interview results with InterviewAce.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="relative z-10 px-10 py-4 bg-white text-indigo-700 font-black rounded-2xl text-base sm:text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl active:scale-95 inline-flex items-center gap-2"
            >
              Start Free Practice Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-gray-100/50 dark:bg-gray-900/30 border-t border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Frequently Asked <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Questions</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-base">
              Got questions? We have answers.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                  >
                    <span className="text-base sm:text-lg">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180 text-indigo-500' : ''
                        }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/80 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                  IA
                </div>
                <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                  Interview<span className="text-indigo-600 dark:text-indigo-400">Ace</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Next-generation AI mock interview platform designed to boost candidate confidence and score offers at top companies.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <li><a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">AI Features</a></li>
                <li><a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing Plans</a></li>
                <li><a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <li><button className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</button></li>
                <li><button className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Blog & Guides</button></li>
                <li><button className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Careers</button></li>
                <li><button className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <li><button className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</button></li>
                <li><button className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Security Overview</button></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            &copy; {new Date().getFullYear()} InterviewAce Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}