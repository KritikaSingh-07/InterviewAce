import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Loader2, Send, Calendar, Clock, BookOpen } from 'lucide-react';
import api from '../../lib/api';
import Modal from '../ui/Modal';

interface ScheduleSessionModalProps {
  mentorId: string;
  mentorName: string;
  mentorImage?: string;
  dateStr: string; // YYYY-MM-DD
  startTimeStr: string; // HH:mm
  duration: number; // 30 or 60
  availabilitySlotId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const TOPICS = [
  'Data Structures & Algorithms (DSA)',
  'System Design',
  'Mock Technical Interview',
  'Resume Review & Profile Optimization',
  'Career Guidance & Mentorship',
  'Behavioral Prep & HR Screening',
];

export default function ScheduleSessionModal({
  mentorId,
  mentorName,
  mentorImage,
  dateStr,
  startTimeStr,
  duration,
  availabilitySlotId,
  onClose,
  onSuccess,
}: ScheduleSessionModalProps) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [studentMessage, setStudentMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      toast.error('Please select a session topic');
      return;
    }

    setLoading(true);
    try {
      await api.post('/sessions', {
        mentorId,
        date: dateStr,
        startTime: startTimeStr,
        duration,
        topic,
        studentMessage: studentMessage.trim(),
        availabilitySlotId,
      });
      toast.success('Session request submitted successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || 'Failed to submit booking request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Request Session"
      description={`with ${mentorName}`}
      maxWidth="max-w-lg"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Slot summary details */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-850 rounded-xl text-xs font-semibold text-gray-650 dark:text-gray-350">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Date</span>
            <span className="flex items-center gap-1.5 text-gray-900 dark:text-white">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {dateStr}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Start Time</span>
            <span className="flex items-center gap-1.5 text-gray-900 dark:text-white">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              {startTimeStr}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Duration</span>
            <span className="flex items-center gap-1.5 text-gray-900 dark:text-white">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              {duration} minutes
            </span>
          </div>
        </div>

        {/* Topic dropdown */}
        <div>
          <label
            htmlFor="topic"
            className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2"
          >
            Session Topic
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preparation Notes message */}
        <div>
          <label
            htmlFor="message"
            className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2"
          >
            Message & Preparation Notes
          </label>
          <textarea
            id="message"
            value={studentMessage}
            onChange={(e) => setStudentMessage(e.target.value)}
            rows={4}
            placeholder="Briefly state what you're working on, any questions you want to discuss, or share your resume link..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors"
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
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
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
