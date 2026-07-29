import { motion } from 'framer-motion';
import {
  Code,
  Layout,
  Database,
  Terminal,
  Cpu,
  BarChart,
  ShieldAlert,
  GitBranch,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

interface CareerCardProps {
  title: string;
  selected: boolean;
  onClick: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  'Software Engineer': Code,
  'Frontend Developer': Layout,
  'Backend Developer': Database,
  'Full Stack Developer': Terminal,
  'AI Engineer': Cpu,
  'Data Scientist': BarChart,
  'Cyber Security Engineer': ShieldAlert,
  'DevOps Engineer': GitBranch,
  'Product Manager': Briefcase,
};

export default function CareerCard({ title, selected, onClick }: CareerCardProps) {
  const IconComponent = iconMap[title] || Code;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-5 rounded-xl border flex items-center gap-4 transition-all ${
        selected
          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-600 dark:border-indigo-500 shadow-md'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          selected
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <div>
        <span className="font-semibold text-gray-900 dark:text-white block text-sm sm:text-base">
          {title}
        </span>
      </div>
    </motion.button>
  );
}
