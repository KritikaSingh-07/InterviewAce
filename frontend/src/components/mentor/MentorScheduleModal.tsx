import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock, Clock, Loader2, User, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { MentorStudent } from '../../types';

const INTERVIEW_TYPES = [
  'Technical Round',
  'Behavioral',
  'System Design',
  'HR Screening',
  'Mixed',
];

const DURATIONS = [10, 15, 20, 30, 45, 60];

interface MentorScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: MentorStudent[];
  selectedStudent?: MentorStudent | null;
  onScheduled?: () => void;
}

export const MentorScheduleModal: React.FC<MentorScheduleModalProps> = ({
  isOpen,
  onClose,
  students,
  selectedStudent,
  onScheduled,
}) => {
  const [studentId, setStudentId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [duration, setDuration] = useState<number>(15);
  const [type, setType] = useState<string>('Technical Round');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedStudent?._id) {
      setStudentId(selectedStudent._id);
    } else if (students.length > 0 && !studentId) {
      setStudentId(students[0]._id);
    }
  }, [selectedStudent, students]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error('Please select a student');
      return;
    }
    if (!scheduledAt) {
      toast.error('Please choose a start time for the interview');
      return;
    }

    setLoading(true);
    try {
      await api.post('/mentor/interviews', {
        studentId,
        scheduledAt,
        duration,
        type,
      });

      toast.success('Mock interview scheduled! Student has been notified.');
      onScheduled?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  const currentStudentObj = students.find((s) => s._id === studentId) || selectedStudent;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-10"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule Mock Interview</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Set up 1-on-1 session with student</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Target Student *
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="input-field cursor-pointer font-medium"
                required
              >
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.plan === 'agency' ? 'Agency' : 'Model Pro'}) — {s.careerGoal || 'Student'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Student Quick Info */}
            {currentStudentObj && (
              <div className="p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-500" />
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {currentStudentObj.fullName}
                  </span>
                </div>
                <span className="font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[10px]">
                  {currentStudentObj.plan === 'agency' ? 'Agency' : 'Model Pro'}
                </span>
              </div>
            )}

            {/* Date & Time Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Date & Time (Local) *
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Duration and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Duration *
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="input-field cursor-pointer"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} Minutes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Interview Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 text-violet-500 shrink-0" />
              <span>An automated calendar invitation and in-app alert will be dispatched.</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                Confirm Session
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MentorScheduleModal;
