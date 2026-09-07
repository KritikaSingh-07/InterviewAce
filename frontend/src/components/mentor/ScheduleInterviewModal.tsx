import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Loader2, Send } from 'lucide-react';
import api from '../../lib/api';
import { MentorCard } from '../../types';
import Modal from '../ui/Modal';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Schedule Interview"
      description={`with ${mentor.fullName}`}
      maxWidth="max-w-lg"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
    </Modal>
  );
}

