import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  GraduationCap,
  Briefcase,
  Building2,
  CalendarClock,
  Target,
  Sparkles,
  Award,
  Crown,
  BookOpen,
  Code2,
  Linkedin,
  Github,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Flame,
  FileText,
  Clock,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { MentorStudent, StudentDetailProfile } from '../../types';

interface StudentDetailModalProps {
  student: MentorStudent | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleInterview: (student: MentorStudent) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onScheduleInterview,
}) => {
  const [detailedData, setDetailedData] = useState<StudentDetailProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'competencies' | 'targets' | 'history'>('overview');

  useEffect(() => {
    if (isOpen && student?._id) {
      fetchStudentDetails(student._id);
    } else {
      setDetailedData(null);
      setActiveTab('overview');
    }
  }, [isOpen, student?._id]);

  const fetchStudentDetails = async (studentId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/mentor/students/${studentId}`);
      setDetailedData(data.student);
    } catch (error: any) {
      console.error('Failed to fetch student details:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch detailed profile');
      // Fallback to preview data if detailed fetch fails
      setDetailedData(student as StudentDetailProfile);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  const data = detailedData || (student as StudentDetailProfile);
  const isAgency = data.plan === 'agency';
  const planLabel = isAgency ? 'Agency' : 'Model Pro';

  // Self assessment skills
  const assessmentEntries = Object.entries(data.selfAssessment || {});

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
          className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header Banner */}
          <div
            className={`relative p-6 sm:p-8 pb-6 border-b border-gray-100 dark:border-gray-800 ${
              isAgency
                ? 'bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-amber-500/10'
                : 'bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-800 shadow-xs transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Profile Picture */}
              <div className="relative">
                {data.profileImage ? (
                  <img
                    src={data.profileImage}
                    alt={data.fullName}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-md"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md ${
                      isAgency
                        ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500'
                        : 'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600'
                    }`}
                  >
                    {data.fullName ? data.fullName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                  </div>
                )}
                <div
                  className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg border-2 border-white dark:border-gray-900 shadow-sm ${
                    isAgency ? 'bg-amber-500 text-white' : 'bg-violet-600 text-white'
                  }`}
                >
                  {isAgency ? <Crown className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Student Identity & Plan Badge */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                    {data.fullName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs border ${
                      isAgency
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30'
                    }`}
                  >
                    {isAgency ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <Sparkles className="w-3.5 h-3.5 text-violet-500" />}
                    Tier: {planLabel}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5 truncate">
                  <Target className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>Target Role: {data.careerGoal || 'Software Engineer'}</span>
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {data.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    {data.college || 'N/A'} • {data.degree || 'Degree'} (Yr {data.year || 1})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Tabs */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200/60 dark:border-gray-800/60 overflow-x-auto pb-1">
              {[
                { key: 'overview', label: 'Background & Bio' },
                { key: 'competencies', label: 'Skills & Tech Stack' },
                { key: 'targets', label: 'Target Companies' },
                { key: 'history', label: 'Interview History & Stats' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Body with scroll */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Loading complete profile & competencies...
                </p>
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW & BACKGROUND */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Basic Background Knowledge & Summary */}
                    <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-violet-500" /> Candidate Bio & Career Summary
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {data.bio ||
                          (data.roadmaps && data.roadmaps[0]?.careerBio) ||
                          `${data.fullName} is an active student preparing for ${data.careerGoal || 'Software Engineering'} roles with strong interest in top tech placement.`}
                      </p>
                    </div>

                    {/* Academic Background Details */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Education & University
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{data.college || 'Not specified'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {data.degree || 'Degree'} • {data.branch || 'Branch'}
                        </p>
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          Year {data.year || 1}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-violet-500" /> Career Trajectory
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{data.careerGoal || 'Software Engineer'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Experience: {data.yearsOfExperience ? `${data.yearsOfExperience} yrs` : 'Student / Entry Level'}
                        </p>
                        {data.codingPreferences?.language && (
                          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            Primary Language: {data.codingPreferences.language}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Social Profiles & External Links */}
                    {(data.linkedinUrl || data.githubUrl) && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {data.linkedinUrl && (
                          <a
                            href={data.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline"
                          >
                            <Linkedin className="w-4 h-4" /> LinkedIn Profile
                          </a>
                        )}
                        {data.githubUrl && (
                          <a
                            href={data.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:underline"
                          >
                            <Github className="w-4 h-4" /> GitHub Portfolio
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SKILLS & TECH STACK / COMPETENCIES */}
                {activeTab === 'competencies' && (
                  <div className="space-y-6">
                    {/* Self Assessment Competency Matrix */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-violet-500" /> Self-Assessment Breakdown
                      </h4>
                      {assessmentEntries.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {assessmentEntries.map(([skillName, rating]) => {
                            const scoreNum = Number(rating) || 0;
                            const pct = Math.min(100, (scoreNum / 5) * 100);
                            return (
                              <div
                                key={skillName}
                                className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2"
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{skillName}</span>
                                  <span className="font-extrabold text-violet-600 dark:text-violet-400 shrink-0">
                                    {scoreNum} / 5 Stars
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No self-assessment recorded yet.</p>
                      )}
                    </div>

                    {/* Additional Skills / Tech Stack */}
                    {data.skills && data.skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-indigo-500" /> Additional Tech Stack & Competencies
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {data.skills.map((skill: any, i) => {
                            const name = typeof skill === 'string' ? skill : skill.name;
                            const level = typeof skill === 'object' ? skill.level : undefined;
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50 text-xs font-semibold"
                              >
                                <Code2 className="w-3.5 h-3.5 text-violet-500" />
                                {name} {level ? `(${level})` : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: TARGET COMPANIES */}
                {activeTab === 'targets' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 text-xs text-violet-800 dark:text-violet-300">
                      Companies the candidate is actively targeting for mock interview preparation and placement roadmaps.
                    </div>

                    {data.targetCompanies && data.targetCompanies.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {data.targetCompanies.map((comp) => (
                          <div
                            key={comp}
                            className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/70 dark:border-gray-800 flex items-center gap-3 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{comp}</p>
                              <p className="text-[11px] text-gray-400">Target placement</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Building2 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-xs text-gray-400">No target companies specified yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: INTERVIEW HISTORY & READINESS */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    {/* Performance Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-center">
                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {Math.round(data.score || 0)}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-1">
                          Avg AI Score
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
                        <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          {data.interviewsCompleted || 0}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-1">
                          Sessions Done
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-center">
                        <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                          {data.totalPoints || 0}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-1">
                          Leaderboard Pts
                        </div>
                      </div>
                    </div>

                    {/* Recent Sessions List */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-violet-500" /> Recent Mock Interviews
                      </h4>
                      {data.mockInterviews && data.mockInterviews.length > 0 ? (
                        <div className="space-y-2.5">
                          {data.mockInterviews.map((session) => (
                            <div
                              key={session._id}
                              className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{session.type} ({session.role})</p>
                                <p className="text-gray-400 text-[11px] mt-0.5">
                                  {new Date(session.scheduledAt || session.createdAt).toLocaleDateString()} • {session.duration} mins
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    session.status === 'completed'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                  }`}
                                >
                                  {session.status}
                                </span>
                                {session.rating !== undefined && session.rating !== null && (
                                  <span className="font-bold text-violet-600 dark:text-violet-400">
                                    {session.rating}/100
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No previous mock interview sessions logged.</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal Footer CTA */}
          <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2.5 px-5 text-sm"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onScheduleInterview(data);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all active:scale-[0.98]"
            >
              <CalendarClock className="w-4 h-4" /> Schedule Mock Interview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudentDetailModal;
