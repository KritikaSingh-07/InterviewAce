import React from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Target,
  Mail,
  Building2,
  CalendarClock,
  Sparkles,
  Award,
  Crown,
  ChevronRight,
  User,
} from 'lucide-react';
import { MentorStudent } from '../../types';

interface StudentCardProps {
  student: MentorStudent;
  onSelect: (student: MentorStudent) => void;
  onSchedule?: (student: MentorStudent) => void;
  index?: number;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onSelect,
  onSchedule,
  index = 0,
}) => {
  const isAgency = student.plan === 'agency';
  const planLabel = isAgency ? 'Agency' : 'Model Pro';

  // Get top self-assessment competencies (highest rated or first 3)
  const competencies = Object.entries(student.selfAssessment || {}).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onSelect(student)}
      className="group relative cursor-pointer glass-card p-5 sm:p-6 border border-gray-200/80 dark:border-gray-800/80 hover:border-violet-500/40 dark:hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 transition-all flex flex-col justify-between overflow-hidden"
    >
      {/* Subtle background glow for Agency / Pro tiers */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-40 ${
          isAgency
            ? 'bg-gradient-to-br from-amber-400 to-emerald-500'
            : 'bg-gradient-to-br from-violet-500 to-indigo-600'
        }`}
      />

      <div>
        {/* Header with Full Name and Tier Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {student.profileImage ? (
              <img
                src={student.profileImage}
                alt={student.fullName}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-violet-200 dark:border-violet-500/30 shadow-sm shrink-0"
              />
            ) : (
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 ${
                  isAgency
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500'
                    : 'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600'
                }`}
              >
                {student.fullName ? student.fullName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}

            <div className="min-w-0 flex-1">
              {/* PRIMARY KEY DISPLAY: STUDENT'S FULL NAME FIRST */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                {student.fullName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate mt-0.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </p>
            </div>
          </div>

          {/* Quick Summary Badge (Tier: Model Pro / Agency) */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs border ${
                isAgency
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30'
              }`}
            >
              {isAgency ? (
                <Crown className="w-3 h-3 text-amber-500" />
              ) : (
                <Sparkles className="w-3 h-3 text-violet-500" />
              )}
              {planLabel}
            </span>

            {student.score > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Award className="w-3 h-3" />
                {Math.round(student.score)} pts
              </span>
            )}
          </div>
        </div>

        {/* Academic & Target Role Information */}
        <div className="space-y-2 py-3 border-y border-gray-100 dark:border-gray-800/80 text-sm">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Target className="w-4 h-4 text-violet-500 shrink-0" />
            <span className="font-medium truncate">
              {student.careerGoal || 'Engineering Candidate'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">
              {student.college || 'University Student'}
              {student.branch ? ` • ${student.branch}` : ''}
              {student.year ? ` (Yr ${student.year})` : ''}
            </span>
          </div>
        </div>

        {/* Target Companies Chips */}
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Target Companies
          </div>
          {student.targetCompanies && student.targetCompanies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {student.targetCompanies.slice(0, 3).map((comp) => (
                <span
                  key={comp}
                  className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-medium border border-gray-200/50 dark:border-gray-700/50"
                >
                  {comp}
                </span>
              ))}
              {student.targetCompanies.length > 3 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-semibold">
                  +{student.targetCompanies.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">No specific targets listed</span>
          )}
        </div>

        {/* Competencies Preview */}
        {competencies.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/60">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mb-1.5">
              Competencies
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {competencies.map(([name, rating]) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-xs px-2 py-1 rounded bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                >
                  <span className="truncate text-gray-600 dark:text-gray-300 mr-1 text-[11px]">{name}</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400 text-[11px] shrink-0">
                    {rating}/5★
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(student);
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-300 text-xs font-semibold transition-all"
        >
          View Profile <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {onSchedule && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSchedule(student);
            }}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-500/20 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Schedule
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default StudentCard;
