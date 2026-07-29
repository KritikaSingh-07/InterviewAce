import { Edit2 } from 'lucide-react';

interface ReviewCardProps {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

export default function ReviewCard({ title, onEdit, children }: ReviewCardProps) {
  return (
    <div className="glass bg-white/50 dark:bg-gray-900/40 p-6 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-gray-800/50 pb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wide">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-200 active:scale-95"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <div className="text-sm space-y-3">
        {children}
      </div>
    </div>
  );
}
