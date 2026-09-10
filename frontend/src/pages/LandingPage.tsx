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
  Volume2,
  CheckCircle2,
  Zap,
  TrendingUp,
  Play,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

export default function LandingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { isDarkMode, toggle } = useThemeStore();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  const features = [
    {
      icon: Brain,
      title: 'AI Mock Interviews',
      description: 'Practice with our AI interviewer that adapts to your role, experience, and skill level. Get real-time feedback.',
      color: 'from-indigo-500 to-violet-500',
    },
    {
      icon: Target,
      title: 'Personalized Roadmaps',
      description: 'AI-generated study plans based on your target role, current skills, and career goals.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Track your progress with detailed performance metrics, skill gap analysis, and improvement insights.',
      color: 'from-orange-500 to-rose-500',
    },
    {
      icon: Trophy,
      title: 'Global Leaderboard',
      description: 'Compete with peers worldwide. Earn points, badges, and climb the rankings.',
      color: 'from-amber-500 to-yellow-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer at Google',
      avatar: 'SC',
      content: 'InterviewAce helped me land my dream job at Google. The AI mock interviews were incredibly realistic.',
      rating: 5,
    },
    {
      name: 'James Wilson',
      role: 'Frontend Developer at Meta',
      avatar: 'JW',
      content: 'The personalized roadmap feature is a game-changer. It identified my weak areas and helped me improve systematically.',
      rating: 5,
    },
    {
      name: 'Priya Patel',
      role: 'Data Scientist at Amazon',
      avatar: 'PP',
      content: 'I improved my interview score by 40% in just 2 weeks. The AI feedback is incredibly detailed and actionable.',
      rating: 5,
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Students' },
    { value: '93%', label: 'Success Rate' },
    { value: '50,000+', label: 'Interviews Completed' },
    { value: '4.9/5', label: 'User Rating' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold">IA</span>
              </div>
              <span className="text-xl font-bold gradient-text">InterviewAce</span>
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary text-sm">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Redesigned Hero Section */}
      <section ref={heroRef} className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Subtle Ambient Background Mesh & Glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Fine Radial Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-[#6366f1_1px,transparent_1px]] [background-size:32px_32px] opacity-[0.12] dark:opacity-[0.2]" />

          {/* Soft Ambient Light Orbs */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/20 via-violet-500/20 to-emerald-400/10 rounded-full blur-[120px] pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Headline, Actions & Social Proof */}
            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale }}
              className="lg:col-span-7 space-y-8 text-left"
            >

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl xl:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
              >
                Master your tech <br className="hidden sm:inline" />
                interviews with <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500">
                  real-time AI feedback.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-xl font-normal leading-relaxed"
              >
                Simulate realistic high-stakes technical & behavioral interviews. Receive instant role-specific evaluations, score breakdowns, and customized learning paths.
              </motion.p>

              {/* Action Buttons & Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-base shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 group"
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Start Free Practice'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 rounded-xl bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-semibold text-base border border-gray-200/80 dark:border-gray-800 transition-all duration-200 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Demo
                  </button>
                </div>

                {/* User Avatars */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {['SC', 'JW', 'PP'].map((initials, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 border-2 border-white dark:border-gray-950 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Joined by <span className="font-semibold text-gray-900 dark:text-white">10,000+</span> software engineers
                  </div>
                </div>
              </motion.div>

              {/* Compact Metrics Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-6 border-t border-gray-200/60 dark:border-gray-800/80 grid grid-cols-3 gap-6"
              >
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">93%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Offer Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">50k+</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Interviews Completed</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">4.9/5</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" /> User Rating
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: AI Mock Interview Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              {/* Glow behind terminal */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-violet-600 to-emerald-500 opacity-20 blur-xl dark:opacity-30" />

              {/* Glass Card Container */}
              <div className="relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xl p-6 backdrop-blur-xl overflow-hidden">

                {/* Card Top Window Bar */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        System Design Mock
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">Live Session</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Senior Software Engineer Role</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                </div>

                {/* AI Question & Voice Waveform */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-100 dark:border-gray-800 space-y-3 mb-5">
                  <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" /> AI Interviewer
                    </span>
                    <span>02:14</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "How would you handle cache invalidation across distributed data stores while maintaining consistency?"
                  </p>
                  {/* Animated Audio Equalizer */}
                  <div className="flex items-center justify-center gap-1 pt-1 h-6">
                    {[40, 70, 35, 90, 60, 100, 50, 80, 45, 95, 60, 30, 75, 40].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.4}%`] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
                        className="w-1 rounded-full bg-indigo-500/70"
                      />
                    ))}
                  </div>
                </div>

                {/* Live Analysis Stream */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Strong Technical Precision</div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Accurately referenced write-through cache & pub/sub events.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50 flex items-start gap-3">
                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                        <span>Communication Score</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">94%</span>
                      </div>
                      <div className="w-full h-1.5 bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 w-[94%] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Performance Pill */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl shadow-xl flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Growth</div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">+42% Confidence</div>
                  </div>
                </motion.div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive AI-powered tools designed to maximize your interview performance.
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
                className="glass-card p-8 group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in minutes and see results in days.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                desc: 'Tell us about your target role, experience, and skills. Our AI analyzes your profile instantly.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Practice with AI',
                desc: 'Engage in realistic mock interviews. Get real-time feedback and detailed performance analysis.',
                icon: Bot,
              },
              {
                step: '03',
                title: 'Track & Improve',
                desc: 'Monitor your progress, identify weak areas, and improve systematically with personalized roadmaps.',
                icon: BarChart3,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: parseInt(item.step) * 0.1 }}
                className="text-center p-8"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold gradient-text mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users <span className="gradient-text">Say</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of successful students who aced their interviews.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-8"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

{/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your career goals. Upgrade or cancel anytime.
            </p>
          </motion.div>

          <PricingCards />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500" />
        <div className="absolute inset-0 bg-grid-white/10" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Ace Your Interview?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of students who have transformed their interview performance with AI-powered practice.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-white/25 active:scale-[0.98]"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2 inline" />
          </button>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
              Got questions? We have answers. Find answers to common inquiries about using InterviewAce.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: 'What is InterviewAce?',
                answer: 'InterviewAce is an AI-powered interview preparation platform designed to help students and professionals practice mock interviews, get detailed performance metrics, and generate customized career roadmaps.',
              },
              {
                question: 'Is InterviewAce free?',
                answer: 'Yes! We offer a comprehensive free tier that includes basic mock interviews, personalized roadmap generation, and access to the global leaderboard.',
              },
              {
                question: 'How does AI Mock Interview work?',
                answer: 'Our AI interviewer simulates a live interview session by asking adaptive technical, behavioral, and system design questions. It analyzes your answers to evaluate accuracy and communication skills.',
              },
              {
                question: 'Can I edit my profile later?',
                answer: 'Yes, you can edit your profile details at any time from the settings or dedicated profile section. Any changes are immediately saved and sync across your profile card.',
              },
            ].map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 hover:shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 dark:text-white hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-indigo-500' : ''
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
                        <div className="px-5 pb-5 pt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800/40">
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

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">IA</span>
                </div>
                <span className="text-lg font-bold gradient-text">InterviewAce</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered interview preparation platform helping students land their dream jobs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><button className="hover:text-indigo-500 transition-colors">Features</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">Pricing</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">Testimonials</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><button className="hover:text-indigo-500 transition-colors">About</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">Blog</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">Careers</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><button className="hover:text-indigo-500 transition-colors">Privacy</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">Terms</button></li>
                <li><button className="hover:text-indigo-500 transition-colors">Security</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; 2024 InterviewAce. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}