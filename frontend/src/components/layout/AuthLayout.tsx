import { useOutlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import AnimatedBackground from '../ui/AnimatedBackground';
import ThemeToggle from '../ui/ThemeToggle';

const stats = [
  { value: 'AI', label: 'Mock Interviews' },
  { value: '93%', label: 'Success Rate' },
  { value: '10k+', label: 'Students' },
];

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const outlet = useOutlet();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative isolate min-h-screen bg-gray-50/60 dark:bg-gray-950 flex">
      <AnimatedBackground />
      <ThemeToggle className="absolute top-4 right-4 z-20 lg:right-auto lg:left-4" />

      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md glass rounded-3xl p-6 sm:p-8"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 m-3 rounded-[2rem] bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 bg-[length:200%_200%] animate-gradient items-center justify-center p-12 relative overflow-hidden shadow-2xl shadow-indigo-900/30">
        <div className="bg-grain [--grain-blend:overlay] [--grain-opacity:0.35]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20 blur-3xl animate-aurora" />
        <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-gray-300/20 blur-3xl animate-aurora-reverse" />
        <div className="absolute top-16 left-16 w-16 h-16 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm animate-float" />
        <div className="absolute bottom-20 right-20 w-10 h-10 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm animate-float-slow" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-lg"
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
            className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl flex items-center justify-center"
          >
            <span className="text-white font-bold text-3xl font-display">IA</span>
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Ace Your Next Interview
          </h2>
          <p className="text-lg text-white/85">
            AI-powered mock interviews, personalized roadmaps, and real-time feedback to land your dream job.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-white/75 text-sm">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.04 }}
                className="p-4 rounded-xl bg-white/15 backdrop-blur-md border border-white/20"
              >
                <div className="text-2xl font-bold text-white mb-1 font-display">{stat.value}</div>
                {stat.label}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
