import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
      />
    </div>
  );
}
