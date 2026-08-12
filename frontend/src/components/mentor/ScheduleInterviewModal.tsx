import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Loader2, Send } from 'lucide-react';
import api from '../../lib/api';
import { MentorCard } from '../../types';

interface ScheduleInterviewModalProps {
  mentor: MentorCard;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScheduleInterviewModal({
  mentor,
  onClose,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const [targetRole, setTargetRole] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      toast.error('Please specify your target role');
      return;
    }
    if (!bio.trim()) {
      toast.error('Please provide a short bio / pitch');
      return;
    }

    setLoading(true);
    try {
      await api.post('/mentors/requests', {
        mentorId: mentor._id,
        targetRole: targetRole.trim(),
        bio: bio.trim(),
      });
      toast.success('Interview request sent successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          'Failed to send request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {mentor.profileImage ? (
                <img
                  src={mentor.profileImage}
                  alt={mentor.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  {mentor.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Schedule Interview
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  with {mentor.fullName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="targetRole"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Job / Target Role
              </label>
              <input
                id="targetRole"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Developer, Data Analyst, Product Manager..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Short Bio / Pitch
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Tell the mentor about your background, what you're preparing for, and what you'd like to focus on in the interview..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

