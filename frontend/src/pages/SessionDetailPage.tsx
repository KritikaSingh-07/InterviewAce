import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Video,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  History,
  MessageSquare,
  Star,
} from 'lucide-react';
import api from '../lib/api';

interface TimelineEvent {
  action: string;
  by: {
    _id: string;
    email: string;
    fullName?: string;
  };
  note: string;
  timestamp: string;
}

interface MentorFeedbackDetail {
  _id: string;
  overallRating: number;
  communication?: number;
  professionalism?: number;
  explanation?: number;
  problemSolving?: number;
  technicalSkills?: number;
  preparation?: number;
  engagement?: number;
  comment?: string;
  createdAt: string;
}

interface SessionDetail {
  _id: string;
  student: any;
  mentor: any;
  studentName: string;
  mentorName: string;
  topic: string;
  studentMessage: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  meetingLink: string | null;
  rejectionReason: string | null;
  feedbackSubmitted?: boolean;
  timeline: TimelineEvent[];
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [mentorFeedback, setMentorFeedback] = useState<MentorFeedbackDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSessionDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/sessions/${id}`);
      setSession(data.session);

      // Fetch improvement feedback given by mentor for this session
      try {
        const feedbackRes = await api.get(`/sessions/${id}/feedback`);
        const feedbacks = feedbackRes.data?.feedbacks || [];
        if (feedbacks.length > 0) {
          setMentorFeedback(feedbacks[0]);
        }
      } catch (err) {
        console.error('Failed to fetch session feedback:', err);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch session detail.');
      navigate('/dashboard/sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'PENDING':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
      case 'REJECTED':
      case 'CANCELLED_BY_STUDENT':
      case 'CANCELLED_BY_MENTOR':
        return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';
      case 'COMPLETED':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'RESCHEDULE_REQUESTED':
        return 'bg-indigo-50 text-indigo-650 dark:text-indigo-400';
      default:
        return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-gray-550 dark:text-gray-400">Loading session details...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-8">
      {/* Back CTA */}
      <button
        onClick={() => navigate('/dashboard/sessions')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-650 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Details Summary */}
        <div className="col-span-1 lg:col-span-2 space-y-8">

          {/* Main info panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="space-y-1">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${getStatusColor(session.status)}`}>
                  {session.status.replace(/_/g, ' ')}
                </span>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">
                  {session.topic}
                </h1>
              </div>

              {session.status === 'CONFIRMED' && session.meetingLink && (
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg transition-all"
                >
                  <Video className="w-4 h-4" /> Join Google Meet <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Timings grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-850 rounded-xl">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Date</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(session.scheduledStart).toLocaleDateString(undefined, {
                      timeZone: session.timezone,
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-850 rounded-xl">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Time window</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(session.scheduledStart).toLocaleTimeString([], {
                      timeZone: session.timezone,
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(session.scheduledEnd).toLocaleTimeString([], {
                      timeZone: session.timezone,
                      hour: '2-digit',
                      minute: '2-digit'
                    })} ({session.timezone})
                  </p>
                </div>
              </div>
            </div>

            {/* Note details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Participant Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border dark:border-gray-800 rounded-xl flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Mentor</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{session.mentorName}</p>
                    </div>
                  </div>
                  <div className="p-3 border dark:border-gray-800 rounded-xl flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Student</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{session.studentName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {session.studentMessage && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gray-400" /> Request Note
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl text-sm text-gray-750 dark:text-gray-300 italic border border-gray-150 dark:border-gray-800 leading-relaxed">
                    "{session.studentMessage}"
                  </div>
                </div>
              )}

              {session.rejectionReason && (
                <div className="p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-500/25 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase">Rejection Reason</span>
                    <p className="text-sm">{session.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* System 1: Mentor Improvement Feedback Section */}
          {mentorFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 space-y-6 border border-indigo-500/20"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    Mentor Feedback
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Session evaluation & growth recommendation provided by mentor
                  </p>
                </div>
                <div className="flex items-center gap-1 font-bold text-base bg-amber-500/10 px-3.5 py-1.5 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Star className="w-4 h-4 fill-current text-amber-400" />
                  {mentorFeedback.overallRating}/5
                </div>
              </div>

              {/* Category Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mentorFeedback.communication && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Communication</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{mentorFeedback.communication}/5</p>
                  </div>
                )}
                {mentorFeedback.explanation && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Explanation</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{mentorFeedback.explanation}/5</p>
                  </div>
                )}
                {mentorFeedback.problemSolving && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Problem Solving</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{mentorFeedback.problemSolving}/5</p>
                  </div>
                )}
                {mentorFeedback.technicalSkills && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Technical Skills</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{mentorFeedback.technicalSkills}/5</p>
                  </div>
                )}
                {mentorFeedback.professionalism && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Professionalism</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{mentorFeedback.professionalism}/5</p>
                  </div>
                )}
              </div>

              {/* Written Comments / Improvement Areas */}
              {mentorFeedback.comment && (
                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 space-y-1.5">
                  <h4 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                    Areas to Improve & Mentor Suggestions
                  </h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic whitespace-pre-line">
                    "{mentorFeedback.comment}"
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Timeline Audit Trail */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 space-y-6"
          >
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Session Timeline Audit Logs
            </h3>

            <div className="relative pl-6 border-l border-gray-205 dark:border-gray-850 space-y-6">
              {session.timeline.map((event, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-gray-900" />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-550 dark:text-gray-400">
                      <span className="capitalize text-gray-900 dark:text-white font-bold">{event.action.replace(/_/g, ' ')}</span>
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    {event.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-450">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Interactive card reminders */}
        <div className="col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Session Assistance</h3>
            <div className="space-y-3 text-xs text-gray-500 leading-relaxed">
              <p>For support regarding rescheduled appointments or missing Google Meet conference URLs, please contact platform administrators.</p>

              <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Booking Reference ID</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono break-all">{session._id}</p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
