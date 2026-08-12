import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { MockInterview } from "../../types";
import {
  ArrowLeft,
  Loader2,
  Clock,
  BrainCircuit,
  Send,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Star,
  Target,
  MessageSquare,
  TrendingUp,
  Award,
  Volume2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface Question {
  _id: string;
  question: string;
  questionType: string;
  difficulty?: string;
  status?: string;
  questionNumber?: number;
  userAnswer?: string;
  score?: number;
  maxScore?: number;
  aiFeedback?: any;
  duration?: number;
  answeredAt?: string;
}

interface DynamicInterview extends Omit<MockInterview, 'questions'> {
  currentDifficulty?: string;
  totalQuestionsAsked?: number;
  expiresAt?: string;
  questions: Question[];
}

/* ------------------------------------------------------------------ */
/*  Speech recognition types                                          */
/* ------------------------------------------------------------------ */
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export default function InterviewSession() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const answerRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- Mic & voice preference ---------- */
  const [micReady, setMicReady] = useState(false);          // whether mic permission is granted
  const [micTesting, setMicTesting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // user wants voice input

  /* ---------- Core state ---------- */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [answer, setAnswer] = useState("");
  const [interview, setInterview] = useState<DynamicInterview | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  /* ---------- refs ---------- */
  const hasFinishedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const questionStartTimeRef = useRef(Date.now());
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognizingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  /* ================================================================ */
  /*  Derived values                                                  */
  /* ================================================================ */
  const isCompleted = interview?.status === "completed";
  const isInProgress = interview?.status === "in-progress";
  const currentQuestion = interview?.questions[currentQIndex];

  const answeredCount = useMemo(
    () =>
      interview?.questions.filter((q) => q.status === "answered").length ?? 0,
    [interview]
  );

  const timeProgressPercent = useMemo(() => {
    if (!interview || !interview.duration) return 0;
    const totalSecs = interview.duration * 60;
    return ((totalSecs - remainingSeconds) / totalSecs) * 100;
  }, [interview, remainingSeconds]);

  const difficultyColor = currentQuestion?.difficulty
    ? currentQuestion.difficulty === "hard"
      ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
      : currentQuestion.difficulty === "medium"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
        : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
    : "";
  const fetchInterview = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/interviews/${id}`);
      const fetched: DynamicInterview = data.interview;
      setInterview(fetched);

      if (fetched.status === "in-progress" && fetched.startedAt) {
        const started = new Date(fetched.startedAt).getTime();
        const totalSecs = (fetched.duration || 10) * 60;
        const elapsed = Math.floor((Date.now() - started) / 1000);
        const left = Math.max(totalSecs - elapsed, 0);
        setRemainingSeconds(left);
      } else {
        setRemainingSeconds(0);
      }

      const unansweredIndex = fetched.questions.findIndex(
        (q) => q.status !== "answered" && !q.userAnswer
      );
      setCurrentQIndex(unansweredIndex >= 0 ? unansweredIndex : 0);
      questionStartTimeRef.current = Date.now();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Unable to load interview");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  /* ================================================================ */
  /*  Timer effect                                                    */
  /* ================================================================ */
  useEffect(() => {
    if (!interview || interview.status !== "in-progress" || !interview.startedAt) return;

    const updateTimer = () => {
      const started = new Date(interview.startedAt!).getTime();
      const totalSecs = (interview.duration || 10) * 60;
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const left = Math.max(totalSecs - elapsed, 0);
      setRemainingSeconds(left);

      if (left <= 0 && !hasFinishedRef.current) {
        hasFinishedRef.current = true;
        toast.error('Time limit reached! Completing interview...');
        finishInterview();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [interview]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /* ================================================================ */
  /*  Submit answer                                                   */
  /* ================================================================ */
  const submitAnswer = useCallback(async () => {
    if (!interview || isSubmittingRef.current) return;
    if (!answer.trim()) return;
    if (answer.trim().length < 10) {
      toast.error("Answer must be at least 10 characters long");
      return;
    }

    const question = interview.questions[currentQIndex];
    if (!question) return;

    const actualDuration = Math.floor(
      (Date.now() - questionStartTimeRef.current) / 1000
    );

    isSubmittingRef.current = true;
    setSubmitting(true);
    if (isRecording) stopSpeechRecognition();

    try {
      const { data } = await api.post(
        `/interviews/${id}/question/${question._id}/answer`,
        { answer: answer.trim(), duration: actualDuration }
      );

      setInterview((prev) => {
        if (!prev) return prev;
        const updatedQuestions = [...prev.questions];
        updatedQuestions[currentQIndex] = {
          ...updatedQuestions[currentQIndex],
          status: "answered",
          userAnswer: answer.trim(),
          duration: actualDuration,
          answeredAt: new Date().toISOString(),
        };
        return { ...prev, questions: updatedQuestions };
      });

      setAnswer("");
      finalTranscriptRef.current = "";

      if (data.interviewCompleted) {
        if (data.interview) setInterview(data.interview);
        toast.success("Interview Completed 🎉");
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      if (data.nextQuestion && data.progress) {
        setInterview((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: [...prev.questions, data.nextQuestion],
            totalQuestionsAsked: data.progress.answered,
            currentDifficulty: data.nextQuestion.difficulty,
          };
        });
        setCurrentQIndex(interview.questions.length);
        if (data.progress.remainingTime !== undefined) {
          setRemainingSeconds(data.progress.remainingTime * 60);
        }
        questionStartTimeRef.current = Date.now();

        // If user had voice enabled, restart recording after a small delay
        if (voiceEnabled) {
          setTimeout(() => {
            if (!isRecognizingRef.current && voiceEnabled) {
              startSpeechRecognition();
            }
          }, 2000);
        }
        toast.success("Answer submitted");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to submit answer"
      );
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
      answerRef.current?.focus();
    }
  }, [answer, interview, currentQIndex, id, isRecording, navigate, voiceEnabled]);

  /* ================================================================ */
  /*  Finish interview                                                */
  /* ================================================================ */
  const finishInterview = useCallback(async () => {
    if (finishing || hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setFinishing(true);
    if (isRecording) stopSpeechRecognition();

    try {
      await api.post(`/interviews/${id}/complete`);
      toast.success("Interview Completed 🎉");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      hasFinishedRef.current = false;
      toast.error(
        err.response?.data?.message || "Unable to finish interview"
      );
    } finally {
      setFinishing(false);
    }
  }, [finishing, id, isRecording]);

  /* ================================================================ */
  /*  Keyboard shortcut                                               */
  /* ================================================================ */
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        submitAnswer();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [submitAnswer]);

  /* ================================================================ */
  /*  Focus & reset question timer on new question                    */
  /* ================================================================ */
  useEffect(() => {
    answerRef.current?.focus();
    questionStartTimeRef.current = Date.now();
    // Reset transcript for the new question
    finalTranscriptRef.current = "";
    setAnswer("");
  }, [currentQIndex]);

  /* ================================================================ */
  /*  Text-to-speech for question                                     */
  /* ================================================================ */
  useEffect(() => {
    if (currentQuestion?.question && isInProgress) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQIndex, currentQuestion, isInProgress]);

  /* ================================================================ */
  /*  Speech recognition                                              */
  /* ================================================================ */
  const startSpeechRecognition = () => {
    if (isRecognizingRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      setAnswer(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech error:", event.error);
      if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.");
      }
      stopSpeechRecognition();
    };

    recognition.onend = () => {
      if (isRecognizingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          isRecognizingRef.current = false;
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    isRecognizingRef.current = true;
    recognition.start();
    setIsRecording(true);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      isRecognizingRef.current = false;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // User manually turned off – remember this choice
      setVoiceEnabled(false);
      stopSpeechRecognition();
    } else {
      // User manually turned on – allow continuous recording again
      setVoiceEnabled(true);
      finalTranscriptRef.current = answer;
      startSpeechRecognition();
    }
  };

  // Auto-start recording when interview is in progress and voice is enabled
  useEffect(() => {
    if (isInProgress && voiceEnabled && !isRecording && micReady && !submitting) {
      // Give a tiny delay to allow TTS to finish (optional)
      const timer = setTimeout(() => {
        if (!isRecognizingRef.current && voiceEnabled) {
          startSpeechRecognition();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInProgress, voiceEnabled, currentQIndex, submitting, micReady, isRecording]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      window.speechSynthesis.cancel();
    };
  }, []);

  /* ================================================================ */
  /*  Mic test (simplified – only permission, no speech test)         */
  /* ================================================================ */
  const requestMicAndTest = async () => {
    setMicTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      toast.success("Microphone access granted! Voice input enabled.");
      setMicReady(true);
      setVoiceEnabled(true); // automatically enable voice after permission
    } catch (err) {
      toast.error("Microphone permission denied. You can still type your answers.");
      setMicReady(true);
      setVoiceEnabled(false);
    } finally {
      setMicTesting(false);
    }
  };

  const skipMicTest = () => {
    setMicReady(true);
    setVoiceEnabled(false);
  };

  /* ================================================================ */
  /*  Loading / empty states                                          */
  /* ================================================================ */
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
        <Link
          to="/dashboard/interviews"
          className="text-indigo-500 hover:underline"
        >
          Back to interviews
        </Link>
      </div>
    );
  }

  if (!isInProgress && !isCompleted) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-semibold">Interview Not Active</h2>
        <p className="text-gray-500">
          This interview is not currently in session.
        </p>
        <Link to="/dashboard/interviews" className="btn-primary inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  /* Mic test screen (only for in-progress, before micReady) */
  if (isInProgress && !micReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md w-full text-center space-y-6"
        >
          <Mic className="w-12 h-12 text-indigo-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Microphone Setup
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            For the best experience, allow microphone access so you can answer
            by speaking. You can always type if you prefer.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={requestMicAndTest}
              disabled={micTesting}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {micTesting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  Enable Microphone
                </>
              )}
            </button>
            <button onClick={skipMicTest} className="btn-secondary">
              Skip, I'll type
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Main render                                                     */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/dashboard/interviews"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-500 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Interviews
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {interview.role} Interview
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {interview.type} • {interview.experience} level
          </p>
        </div>
        <div className="text-right">
          {isCompleted && interview.totalScore != null && (
            <div className="text-4xl font-bold gradient-text">
              {interview.totalScore}
            </div>
          )}
          {isInProgress && (
            <div className="rounded-xl px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time Remaining
              </div>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatTime(remainingSeconds)}
              </div>
            </div>
          )}
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              isCompleted
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {isCompleted ? "completed" : interview.status}
          </span>
        </div>
      </div>

      {/* Completed view */}
      {isCompleted ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Performance Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Overall Score",
                  value: interview.overallFeedback?.overallScore || 0,
                  icon: Award,
                  color: "text-indigo-500",
                },
                {
                  label: "Communication",
                  value: interview.overallFeedback?.communicationScore || 0,
                  icon: MessageSquare,
                  color: "text-emerald-500",
                },
                {
                  label: "Technical",
                  value: interview.overallFeedback?.technicalAccuracy || 0,
                  icon: BrainCircuit,
                  color: "text-amber-500",
                },
                {
                  label: "Confidence",
                  value: interview.overallFeedback?.confidenceScore || 0,
                  icon: TrendingUp,
                  color: "text-purple-500",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <stat.icon
                    className={`w-6 h-6 mx-auto mb-2 ${stat.color}`}
                  />
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5" /> Strengths
              </h3>
              <ul className="space-y-2">
                {interview.overallFeedback?.strengths?.map(
                  (s: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" /> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {interview.overallFeedback?.weaknesses?.map(
                  (w: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      {w}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {interview.overallFeedback?.improvementTips?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />{" "}
                Improvement Tips
              </h3>
              <div className="space-y-2">
                {interview.overallFeedback.improvementTips.map(
                  (tip: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/5"
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {tip}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Question Review</h3>
            <div className="space-y-4">
              {interview.questions.map((q: Question, i: number) => (
                <div
                  key={q._id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Q{i + 1}. {q.question}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        (q.score ?? 0) >= (q.maxScore ?? 100) * 0.7
                          ? "text-emerald-500"
                          : (q.score ?? 0) >= (q.maxScore ?? 100) * 0.5
                            ? "text-amber-500"
                            : "text-red-500"
                      }`}
                    >
                      {q.score ?? 0}/{q.maxScore ?? 100}
                    </span>
                  </div>
                  {q.aiFeedback && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <p>
                        Strengths:{" "}
                        {q.aiFeedback.strengths?.join(", ") || "N/A"}
                      </p>
                      <p>
                        Missing:{" "}
                        {q.aiFeedback.missingKeywords?.join(", ") || "None"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        /* In‑progress view */
        <motion.div
          key={currentQIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Questions Answered: <strong>{answeredCount}</strong>
            </span>
            <span className="flex items-center gap-2">
              {currentQuestion?.difficulty && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor}`}
                >
                  {currentQuestion.difficulty.toUpperCase()}
                  {currentQuestion.maxScore &&
                    ` (${currentQuestion.maxScore} pts)`}
                </span>
              )}
              <span className={`flex items-center gap-1 font-mono font-semibold ${remainingSeconds < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>
                <Clock className="w-4 h-4" /> {formatTime(remainingSeconds)} left
              </span>
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all"
              style={{ width: `${timeProgressPercent}%` }}
            />
          </div>

          <div className="glass-card p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
              <BrainCircuit className="w-5 h-5" />
              {currentQuestion?.questionType?.toUpperCase() || "QUESTION"}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentQuestion?.question}
            </h2>

            <div className="space-y-4">
              <textarea
                ref={answerRef}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  finalTranscriptRef.current = e.target.value;
                }}
                className="input-field h-40 resize-none"
                placeholder="Type your answer or use voice input... (min 10 characters)"
                disabled={submitting}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleRecording}
                  disabled={submitting}
                  className={`p-3 rounded-xl transition-all ${
                    isRecording
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || submitting || isSubmittingRef.current}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Answer...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              💡 Tips for a great answer:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Structure your answer using frameworks like STAR</li>
              <li>Be specific with examples from your experience</li>
              <li>Show both technical depth and soft skills</li>
              <li>Take your time – quality over speed</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
