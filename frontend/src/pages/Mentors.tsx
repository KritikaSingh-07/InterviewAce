import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Linkedin,
  CalendarClock,
  Loader2,
  Search,
  Lock,
  ArrowUpRight,
  Briefcase,
  GraduationCap,
  Sparkles,
  X,
  BadgeCheck,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { MentorCard } from '../types';
import ScheduleInterviewModal from '../components/mentor/ScheduleInterviewModal';

const LOCKED_MESSAGE =
  'This feature is locked. To unlock this, upgrade to Pro or Agency.';

const isEligiblePlan = (plan?: string) => plan === 'pro' || plan === 'agency';

export default function Mentors() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<MentorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<MentorCard | null>(null);
  const [detailMentor, setDetailMentor] = useState<MentorCard | null>(null); // For view details modal

  const eligible = useMemo(() => isEligiblePlan(user?.plan), [user?.plan]);

  useEffect(() => {
    if (!eligible) {
      setLoading(false);
      return;
    }
    fetchMentors();
  }, [eligible]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mentors');
      setMentors(data.mentors || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.error || LOCKED_MESSAGE);
      } else {
        toast.error('Failed to load mentors. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.designation.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      m.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  // Ineligible users (non-Pro/Agency) see a locked state
  if (!eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-10 md:p-14 flex flex-col items-center text-center border border-gray-700 shadow-xl"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/10 backdrop-blur-sm text-amber-400 border border-amber-500/30 text-xs font-semibold uppercase tracking-wide mb-4">
            Premium Feature
          </span>
          <h2 className="text-3xl font-bold text-white mb-3">
            Mentor Section Locked
          </h2>
          <p className="text-gray-300 max-w-md mb-8 leading-relaxed">
            {LOCKED_MESSAGE}
          </p>
          <button
            onClick={() => navigate('/#pricing')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold shadow-lg shadow-amber-500/30 transition-all active:scale-[0.98]"
          >
            Upgrade Now
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-8 md:p-10 text-white shadow-xl shadow-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Mentor Directory
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Schedule 1-on-1 mock interviews with industry experts
            </h1>
            <p className="text-white/80 max-w-lg">
              Connect with experienced professionals who can guide you through real interview scenarios.
            </p>

            <div className="relative mt-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role, company or skill..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/20 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="px-5 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
              <div className="text-2xl font-bold">{mentors.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/70">Mentors</div>
            </div>
            <div className="px-5 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
              <div className="text-2xl font-bold">
                {mentors.reduce((acc, m) => acc + (m.experience || 0), 0) > 0
                  ? Math.round(mentors.reduce((acc, m) => acc + (m.experience || 0), 0) / mentors.length)
                  : 0}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/70">Avg. Years</div>
            </div>
            <div className="px-5 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
              <div className="text-2xl font-bold">
                {mentors.reduce((acc, m) => acc + (m.skills?.length || 0), 0)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/70">Skills</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mentor Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor, i) => (
            <motion.div
              key={mentor._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-4">
                {mentor.profileImage ? (
                  <img
                    src={mentor.profileImage}
                    alt={mentor.fullName}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {mentor.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {mentor.fullName}
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium truncate">
                    {mentor.designation}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {mentor.company}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {mentor.experience}+ yrs
                </span>
                {mentor.linkedin && (
                  <a
                    href={mentor.linkedin.startsWith('http') ? mentor.linkedin : `https://${mentor.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" /> Linkedin
                  </a>
                )}
              </div>

              {/* Skills */}
              {mentor.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mentor.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio */}
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 line-clamp-3 mb-5">
                {mentor.bio || 'Experienced professional ready to help you prepare.'}
              </p>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => setDetailMentor(mentor)}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  <BadgeCheck className="w-4 h-4" />
                  View Full Details
                </button>
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  <CalendarClock className="w-4 h-4" /> Schedule Interview
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search ? 'No mentors match your search' : 'No mentors available yet'}
          </p>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {selectedMentor && (
        <ScheduleInterviewModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}

      {/* Mentor Details Modal */}
      <AnimatePresence>
        {detailMentor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailMentor(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Mentor Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setDetailMentor(null)}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4">
                    {detailMentor.profileImage ? (
                      <img
                        src={detailMentor.profileImage}
                        alt={detailMentor.fullName}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                        {detailMentor.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {detailMentor.fullName}
                      </h2>
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {detailMentor.designation}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Briefcase className="w-4 h-4" /> {detailMentor.company}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10">
                      <GraduationCap className="w-5 h-5 text-violet-500 mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {detailMentor.experience}+ years
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Experience</div>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                      <BadgeCheck className="w-5 h-5 text-indigo-500 mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {detailMentor.skills?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Skills</div>
                    </div>
                  </div>

                  {/* Full Bio */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {detailMentor.bio || 'No bio provided.'}
                    </p>
                  </div>

                  {/* Full Skills */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailMentor.skills?.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  {detailMentor.linkedin && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">LinkedIn</h3>
                      <a
                        href={detailMentor.linkedin.startsWith('http') ? detailMentor.linkedin : `https://${detailMentor.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                        View Profile
                      </a>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => {
                      setDetailMentor(null);
                      setSelectedMentor(detailMentor);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                  >
                    <CalendarClock className="w-4 h-4" /> Schedule Interview
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}