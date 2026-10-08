import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDarkMode, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative p-2 rounded-xl overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-purple-400 transition-colors ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDarkMode ? 'sun' : 'moon'}
          initial={{ y: -20, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: 20, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="block"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
