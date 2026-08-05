import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import {
  MessageSquareText,
  Star,
  Download,
  UserCircle2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { MentorInterviewSession } from '../../types';

export default function MentorFeedback() {
  const [interviews, setInterviews] = useState<MentorInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mentor/interviews');
      setInterviews(data.interviews || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const completed = interviews.filter((i) => i.status === 'completed');
  const avgRating = completed.length
    ? (completed.reduce((s, i) => s + (i.rating || i.totalScore || 0), 0) / completed.length).toFixed(0)
    : 0;

  const exportFeedback = (interview: MentorInterviewSession) => {
    const content = [
      `INTERVIEWACE - MENTOR FEEDBACK REPORT`,
      `========================================`,
      `Student: ${interview.studentName || 'N/A'}`,
      `Interview Type: ${interview.type}`,
      `Date: ${new Date(interview.scheduledAt || interview.createdAt).toLocaleString()}`,
      `Duration: ${interview.duration} min`,
      `Rating: ${interview.rating ?? interview.totalScore ?? 'N/A'}/100`,
      ``,
      `Mentor Suggestions:`,
      interview.suggestions || 'No suggestions provided',
      ``,
      `Strengths:`,
      interview.mentorFeedback?.strengths?.join('\n') || 'N/A',
      ``,
      `Areas to Improve:`,
      interview.mentorFeedback?.areasToImprove?.join('\n') || 'N/A',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${interview.studentName || 'student'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <MessageSquareText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Log</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Detailed feedback provided for completed sessions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{avgRating}/100</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</div>
          </div>
        </div>
      </motion.div>

      {completed.length > 0 ? (
        <div className="space-y-4">
          {completed.map((interview, i) => (
            <motion.div
              key={interview._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="glass-card p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 dark:text-white">{interview.studentName}</p>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      {interview.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(interview.scheduledAt || interview.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                    <Star className="w-5 h-5 text-amber-400" />
                    {interview.rating ?? interview.totalScore ?? 'N/A'}
                    <span className="text-xs text-gray-400">/100</span>
                  </div>
                  <button
                    onClick={() => exportFeedback(interview)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Strengths</h4>
                  </div>
                  {interview.mentorFeedback?.strengths?.length ? (
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {interview.mentorFeedback.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No strengths listed</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Areas to Improve</h4>
                  </div>
                  {interview.mentorFeedback?.areasToImprove?.length ? (
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {interview.mentorFeedback.areasToImprove.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No areas listed</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10">
                <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-2">Mentor Suggestions</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {interview.suggestions || 'No suggestions provided'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card">
          <MessageSquareText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No feedback provided yet</p>
        </div>
      )}
    </div>
  );
}
