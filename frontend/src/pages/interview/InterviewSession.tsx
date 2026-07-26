import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { MockInterview } from '../../types';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Star,
  Target,
  MessageSquare,
  TrendingUp,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InterviewSession() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<MockInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchInterview();
  }, [id]);

  const fetchInterview = async () => {
    try {
      const { data } = await api.get(`/interviews/${id}`);
      setInterview(data.interview);
    } catch (error) {
      toast.error('Failed to load interview');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !interview) return;
    const question = interview.questions[currentQIndex];
    if (!question) return;

    setSubmitting(true);
    try {
      await api.post(`/interviews/${id}/question/${question._id}/answer`, {
        answer: answer.trim(),
        duration: 30,
      });
      setAnswer('');
      if (currentQIndex < interview.questions.length - 1) {
        setCurrentQIndex(currentQIndex + 1);
        toast.success('Answer submitted!');
      } else {
        toast.success('All questions answered! Completing interview...');
        completeInterview();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const completeInterview = async () => {
    setCompleting(true);
    try {
      const { data } = await api.post(`/interviews/${id}/complete`);
      setInterview(data.interview);
      toast.success('Interview completed! 🎉');
    } catch (error: any) {
      toast.error('Failed to complete interview');
    } finally {
      setCompleting(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast('Voice recording coming soon!', { icon: '🎤' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold mb-2">Interview Not Found</h2>
        <Link to="/dashboard/interviews" className="text-indigo-500 hover:underline">Back to interviews</Link>
      </div>
    );
  }

  const currentQuestion = interview.questions[currentQIndex];
  const isCompleted = interview.status === 'completed';
  const isInProgress = interview.status === 'in-progress';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/dashboard/interviews" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-500 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Interviews
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{interview.role} Interview</h1>
          <p className="text-gray-500 dark:text-gray-400">{interview.type} • {interview.experience} level</p>
        </div>
        <div className="text-right">
          {isCompleted && interview.totalScore && (
            <div className="text-4xl font-bold gradient-text">{interview.totalScore}</div>
          )}
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            isCompleted ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
          }`}>
            {interview.status}
          </span>
        </div>
      </div>

      {isCompleted ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Score Overview */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Overall Score', value: interview.overallFeedback?.overallScore || 0, icon: Award, color: 'text-indigo-500' },
                { label: 'Communication', value: interview.overallFeedback?.communicationScore || 0, icon: MessageSquare, color: 'text-emerald-500' },
                { label: 'Technical', value: interview.overallFeedback?.technicalAccuracy || 0, icon: BrainCircuit, color: 'text-amber-500' },
                { label: 'Confidence', value: interview.overallFeedback?.confidenceScore || 0, icon: TrendingUp, color: 'text-purple-500' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5" /> Strengths
              </h3>
              <ul className="space-y-2">
                {interview.overallFeedback?.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" /> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {interview.overallFeedback?.weaknesses?.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improvement Tips */}
          {interview.overallFeedback?.improvementTips?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Improvement Tips
              </h3>
              <div className="space-y-2">
                {interview.overallFeedback.improvementTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions Review */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Question Review</h3>
            <div className="space-y-4">
              {interview.questions.map((q, i) => (
                <div key={q._id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Q{i + 1}. {q.question}</span>
                    <span className={`text-sm font-semibold ${q.score >= 70 ? 'text-emerald-500' : q.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {q.score}/100
                    </span>
                  </div>
                  {q.aiFeedback && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <p>Strengths: {q.aiFeedback.strengths?.join(', ') || 'N/A'}</p>
                      <p>Missing: {q.aiFeedback.missingKeywords?.join(', ') || 'None'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : isInProgress && currentQuestion ? (
        <motion.div key={currentQIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Question {currentQIndex + 1} of {interview.questions.length}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> In Progress</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all" style={{ width: `${((currentQIndex) / interview.questions.length) * 100}%` }} />
          </div>

          {/* Question Card */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
              <BrainCircuit className="w-5 h-5" />
              {currentQuestion.questionType?.toUpperCase() || 'QUESTION'}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentQuestion.question}
            </h2>

            {/* Answer Area */}
            <div className="space-y-4">
              <textarea
                ref={answerRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="input-field h-40 resize-none"
                placeholder="Type your answer here... Be detailed and structured in your response."
                disabled={submitting}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500'}`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {currentQIndex === interview.questions.length - 1 ? 'Submit & Complete' : 'Submit Answer'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="glass-card p-4 text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-white mb-1">💡 Tips for a great answer:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Structure your answer using frameworks like STAR</li>
              <li>Be specific with examples from your experience</li>
              <li>Show both technical depth and soft skills</li>
              <li>Take your time - quality over speed</li>
            </ul>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">This interview is ready to start.</p>
          <button onClick={completeInterview} disabled={completing} className="btn-primary mt-4">
            {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Interview'}
          </button>
        </div>
      )}
    </div>
  );
}
