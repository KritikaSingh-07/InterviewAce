import { motion } from 'framer-motion';
import { GraduationCap, Briefcase } from 'lucide-react';

interface RoleCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: 'student' | 'mentor';
}

export default function RoleCard({ selected, onClick, title, description, icon }: RoleCardProps) {
  const IconComponent = icon === 'student' ? GraduationCap : Briefcase;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`w-full text-left p-8 rounded-2xl transition-all duration-300 ${
        selected
          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-500/10'
          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="flex flex-col space-y-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            selected
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
