import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Loader2, Star, Send, ChevronLeft, MessageSquareHeart } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface SessionData {
  _id: string;
  topic: string;
  studentName: string;
  mentorName: string;
  status: string;
  feedbackSubmitted?: boolean;
}

export default function SessionFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<'student' | 'mentor'>('student');

  // Review states
  const [overallRating, setOverallRating] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [explanation, setExplanation] = useState(5);
  const [problemSolving, setProblemSolving] = useState(5);
  // Student rating mentor specific
  const [technicalKnowledge, setTechnicalKnowledge] = useState(5);
  const [patience, setPatience] = useState(5);
  const [guidance, setGuidance] = useState(5);
  // Mentor rating student specific
  const [technicalSkills, setTechnicalSkills] = useState(5);
  // Written comments
  const [comment, setComment] = useState('');

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

      const { user } = useAuthStore.getState();
      const currentRole = data.session.mentor._id === user?.id ? 'mentor' : 'student';
      setRole(currentRole);
    } catch (error: any) {
      toast.error('Failed to resolve session booking details.');
      navigate('/dashboard/sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        overallRating,
        communication,
        professionalism,
        explanation,
        problemSolving,
        comment: comment.trim(),
      };

      if (role === 'student') {
        payload.technicalKnowledge = technicalKnowledge;
        payload.patience = patience;
        payload.guidance = guidance;
      } else {
        payload.technicalSkills = technicalSkills;
      }

      await api.post(`/sessions/${id}/feedback`, payload);
      toast.success('Thank you for your feedback!');
      navigate('/dashboard/sessions');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-gray-500">Resolving session details...</p>
      </div>
    );
  }

  if (!session) return null;

  if (session.feedbackSubmitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <button
          onClick={() => navigate('/dashboard/sessions')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-650 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Sessions
        </button>
        <div className="glass-card p-8 text-center space-y-4 border border-indigo-500/20">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Feedback Already Submitted
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You have already submitted your feedback for this session. Only one feedback submission per user is allowed.
          </p>
          <button
            onClick={() => navigate('/dashboard/sessions')}
            className="btn-primary py-2.5 px-6 mt-2"
          >
            Return to Sessions Dashboard
          </button>
        </div>
      </div>
    );
  }

  const partnerName = role === 'student' ? session.mentorName : session.studentName;

  const renderStarSelector = (value: number, setValue: (v: number) => void, label: string) => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-850 rounded-xl">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue(star)}
              className="text-amber-500 transition-transform active:scale-[0.9] focus:outline-none"
            >
              <Star className={`w-5 h-5 ${star <= value ? 'fill-current' : 'opacity-30'}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Back CTA */}
      <button
        onClick={() => navigate('/dashboard/sessions')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-650 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Review Form container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-gray-105 dark:border-gray-800 pb-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl">
            <MessageSquareHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {role === 'student' ? 'Evaluate Mentor Performance' : 'Submit Student Improvement Feedback'}
            </h1>
            <p className="text-xs text-gray-550 dark:text-gray-400">
              Session topic: "{session.topic}" with {partnerName}.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Metrics Evaluation</h3>

            {/* Common fields */}
            {renderStarSelector(overallRating, setOverallRating, 'Overall Rating')}
            {renderStarSelector(communication, setCommunication, 'Communication')}
            {renderStarSelector(explanation, setExplanation, 'Explanation')}
            {renderStarSelector(problemSolving, setProblemSolving, 'Problem Solving')}
            {renderStarSelector(professionalism, setProfessionalism, 'Professionalism')}

            {/* Student reviewing Mentor */}
            {role === 'student' && (
              <>
                {renderStarSelector(technicalKnowledge, setTechnicalKnowledge, 'Technical Knowledge')}
                {renderStarSelector(patience, setPatience, 'Patience')}
                {renderStarSelector(guidance, setGuidance, 'Guidance')}
              </>
            )}

            {/* Mentor reviewing Student */}
            {role === 'mentor' && (
              <>
                {renderStarSelector(technicalSkills, setTechnicalSkills, 'Technical Skills')}
              </>
            )}
          </div>

          {/* Comment text */}
          <div className="space-y-2">
            <label htmlFor="comments" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              {role === 'student' ? 'Optional Feedback Comments' : 'Areas to Improve & Suggestions for Student'}
            </label>
            <textarea
              id="comments"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={role === 'student' ? 'Share any overall feedback about the mentor...' : 'Explain your approach before coding, improve problem-solving explanation...'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Submit btn */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Session Feedback
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
