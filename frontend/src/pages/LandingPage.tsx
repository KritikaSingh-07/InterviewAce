import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import PricingCards from '../components/pricing/PricingCards';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import ThemeToggle from '../components/ui/ThemeToggle';
import SiteFooter from '../components/layout/SiteFooter';
import HeroSection from '../components/landing/HeroSection';
import { EASE, Magnetic, Reveal, SectionHeading, StaggerGroup, StaggerItem, TiltCard, itemVariants } from '../components/landing/motion';
import {
  Target,
  Brain,
  Trophy,
  BarChart3,
  ArrowRight,
  Star,
  ChevronDown,
  Quote,
  Bot,
  Users,
} from 'lucide-react';

export default function LandingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { scrollY, scrollYProgress: pageProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

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
      color: 'from-purple-600 to-purple-400',
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Track your progress with detailed performance metrics, skill gap analysis, and improvement insights.',
      color: 'from-gray-900 to-gray-600 dark:from-gray-700 dark:to-gray-500',
    },
    {
      icon: Trophy,
      title: 'Global Leaderboard',
      description: 'Compete with peers worldwide. Earn points, badges, and climb the rankings.',
      color: 'from-gray-500 to-gray-400',
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
    <div className="relative isolate min-h-screen bg-gray-50/60 dark:bg-gray-950 overflow-x-hidden">
      <AnimatedBackground />
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: pageProgress }}
        className="fixed top-0 left-0 right-0 h-0.5 origin-left z-[60] bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-500"
      />
      {/* Navigation */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled
            ? 'bg-white/80 dark:bg-gray-950/80 border-gray-200/80 dark:border-white/[0.08] shadow-lg shadow-gray-900/[0.04] dark:shadow-black/40'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 bg-[length:200%_200%] animate-gradient shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                <span className="text-white font-bold font-display">IA</span>
              </div>
              <span className="text-xl font-bold gradient-text">InterviewAce</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />

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
      </motion.nav>

      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-28 relative scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title="Everything You Need to Succeed"
            highlight="Succeed"
            subtitle="Comprehensive AI-powered tools designed to maximize your interview performance."
          />

          <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <StaggerItem key={feature.title} className="h-full">
                <TiltCard className="h-full rounded-2xl">
                  <div className="glass-card h-full p-8 group cursor-pointer relative overflow-hidden">
                    <span className="absolute top-5 right-6 font-display text-5xl font-bold text-gray-900/[0.04] dark:text-white/[0.05] transition-colors duration-500 group-hover:text-indigo-900/10 dark:group-hover:text-violet-500/15">
                      0{i + 1}
                    </span>
                    <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${feature.color} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25`} />
                    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-3 mb-6 shadow-lg transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6 group-hover:-translate-y-1`}>
                      <feature.icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-6 h-px w-10 bg-gradient-to-r from-indigo-800 to-violet-500 transition-all duration-500 ease-out group-hover:w-full" />
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 bg-white/60 dark:bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Process"
            title="How It Works"
            highlight="Works"
            subtitle="Get started in minutes and see results in days."
          />

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connector between the step icons (desktop) */}
            <div aria-hidden className="pointer-events-none absolute top-16 left-[16.66%] right-[16.66%] hidden md:block">
              <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />
              <motion.div
                className="absolute inset-0 h-px origin-left bg-gradient-to-r from-indigo-800 via-violet-500 to-indigo-800"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-120px' }}
                transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
              />
              {/* Clip box so the travelling pulse never runs past the line */}
              <div className="absolute -top-[3px] inset-x-0 h-[7px] overflow-hidden">
                <motion.span
                  className="absolute top-0 left-0 h-[7px] w-16 rounded-full bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                  initial={{ x: '-4rem', opacity: 0 }}
                  whileInView={{ x: ['-4rem', '70vw'], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.2, delay: 2, ease: 'easeInOut' }}
                />
              </div>
            </div>

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
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.25, ease: EASE }}
                className="relative text-center p-8 group"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.35 + i * 0.25 }}
                  className="relative w-16 h-16 mx-auto mb-6"
                >
                  <span className="absolute inset-0 rounded-2xl bg-indigo-800/30 dark:bg-violet-500/30 animate-ping [animation-duration:3s]" style={{ animationDelay: `${i * 0.6}s` }} />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-800 to-violet-600 shadow-lg shadow-indigo-900/30 flex items-center justify-center transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:rotate-6">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <div className="text-5xl font-bold font-display gradient-text mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-28 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Users Say"
            highlight="Say"
            subtitle="Join thousands of successful students who aced their interviews."
          />

          <StaggerGroup className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <StaggerItem key={testimonial.name} className="h-full">
                <TiltCard className="h-full rounded-2xl" max={5}>
                  <div className="glass-card h-full p-8 relative overflow-hidden group">
                    <Quote className="absolute -top-2 -right-2 w-24 h-24 text-gray-900/[0.04] dark:text-white/[0.04] transition-transform duration-700 ease-out group-hover:-rotate-12 group-hover:scale-110" />
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0, rotate: -90 }}
                          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.4 + i * 0.07 }}
                        >
                          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        </motion.span>
                      ))}
                    </div>
                    <p className="relative text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="relative flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-800 to-violet-600 flex items-center justify-center ring-4 ring-indigo-900/5 dark:ring-violet-500/10 transition-transform duration-500 group-hover:scale-105">
                        <span className="text-white font-semibold text-sm">{testimonial.avatar}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 scroll-mt-16 bg-white/60 dark:bg-gray-900/40 border-t border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple, Transparent Pricing"
            highlight="Transparent"
            subtitle="Choose the plan that fits your career goals. Upgrade or cancel anytime."
          />

          <PricingCards />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 bg-[length:200%_200%] animate-gradient" />
        <div className="bg-grain [--grain-blend:overlay] [--grain-opacity:0.35]" />
        <div className="absolute -top-20 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-aurora" />
        <div className="absolute -bottom-24 right-10 w-80 h-80 rounded-full bg-gray-300/20 blur-3xl animate-aurora-reverse" />
        {/* Slowly turning rings */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px]">
          <div className="absolute inset-0 rounded-full border border-dashed border-white/15 animate-[spin_60s_linear_infinite]" />
          <div className="absolute inset-24 rounded-full border border-white/10 animate-[spin_45s_linear_infinite_reverse]">
            <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <SectionHeading
            light
            eyebrow="Get started"
            title="Ready to Ace Your Interview?"
            subtitle="Join thousands of students who have transformed their interview performance with AI-powered practice."
          />
          <Reveal delay={0.5} className="-mt-6">
            <Magnetic strength={0.35}>
              <button
                onClick={() => navigate('/register')}
                className="group relative overflow-hidden px-10 py-4 bg-white text-indigo-900 font-bold rounded-xl text-lg transition-all duration-300 shadow-2xl hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.45)] active:scale-[0.98]"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-900/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Start Your Free Trial</span>
                <ArrowRight className="relative w-5 h-5 ml-2 inline transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-28 scroll-mt-16 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            highlight="Questions"
            subtitle="Got questions? We have answers. Find answers to common inquiries about using InterviewAce."
          />

          <StaggerGroup className="space-y-4">
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
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`rounded-2xl border bg-white/85 dark:bg-gray-900/75 overflow-hidden transition-[border-color,box-shadow] duration-300 hover:shadow-lg hover:shadow-indigo-900/10 ${isOpen ? 'border-indigo-300/70 dark:border-violet-500/30 shadow-lg shadow-indigo-900/10' : 'border-gray-200/60 dark:border-gray-800'}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                        className={`w-5 h-5 transition-transform duration-500 ease-out ${
                        isOpen ? 'rotate-180 text-indigo-700 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'
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
                        transition={{ height: { duration: 0.4, ease: EASE }, opacity: { duration: 0.25 } }}
                      >
                        <div className="px-5 pb-5 pt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}