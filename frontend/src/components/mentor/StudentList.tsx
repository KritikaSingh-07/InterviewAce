import React from 'react';
import { motion } from 'framer-motion';
import { Users, SearchX, Sparkles, Crown } from 'lucide-react';
import { MentorStudent } from '../../types';
import StudentCard from './StudentCard';

interface StudentListProps {
  students: MentorStudent[];
  loading: boolean;
  searchQuery: string;
  selectedPlanFilter: string;
  onSelectStudent: (student: MentorStudent) => void;
  onScheduleStudent?: (student: MentorStudent) => void;
  onClearFilters?: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  loading,
  searchQuery,
  selectedPlanFilter,
  onSelectStudent,
  onScheduleStudent,
  onClearFilters,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="glass-card p-6 border border-gray-200/60 dark:border-gray-800/60 animate-pulse space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
            <div className="space-y-2 py-2">
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    const isFiltered = searchQuery.trim().length > 0 || selectedPlanFilter !== 'all';

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 text-center border border-gray-200/80 dark:border-gray-800/80 rounded-3xl"
      >
        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-500 mx-auto flex items-center justify-center mb-4">
          {isFiltered ? <SearchX className="w-8 h-8" /> : <Users className="w-8 h-8" />}
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {isFiltered ? 'No students match your criteria' : 'No Model Pro or Agency students yet'}
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          {isFiltered
            ? 'Try adjusting your search terms or filter toggle to find enrolled candidates.'
            : 'Only students enrolled in Model Pro or Agency tiers appear in this mentor directory.'}
        </p>

        {isFiltered && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            Reset Search & Filters
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {students.map((student, idx) => (
        <StudentCard
          key={student._id}
          student={student}
          onSelect={onSelectStudent}
          onSchedule={onScheduleStudent}
          index={idx}
        />
      ))}
    </div>
  );
};

export default StudentList;
