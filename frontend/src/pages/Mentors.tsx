import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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

  const eligible = useMemo(() => isEligiblePlan(user?.plan), [user?.plan]);

  useEffect(() => {
    if (!eligible) {
      setLoading(false);
      return;
    }
    fetchMentors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

// Ineligible users (non-Pro/Agency) see a locked state instead of the directory
  if (!eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 md:p-14 flex flex-col items-center text-center border-2 border-dashed border-amber-300 dark:border-amber-700/50"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide mb-4">
          Premium Feature
        </span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Mentor Section Locked
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
          {LOCKED_MESSAGE}
        </p>
        <button
          onClick={() => navigate('/#pricing')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold shadow-lg shadow-amber-500/30 transition-all active:scale-[0.98]"
        >
          Upgrade Now
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mentor Section
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Schedule 1-on-1 mock interviews with industry experts
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, company or skill..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
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
              className="glass-card p-6 flex flex-col hover:shadow-lg transition-shadow"
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

              {/* CTA */}
              <button
                onClick={() => setSelectedMentor(mentor)}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <CalendarClock className="w-4 h-4" /> Schedule Interview
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search ? 'No mentors match your search' : 'No mentors available yet'}
          </p>
        </div>
      )}

      {/* Modal */}
      {selectedMentor && (
        <ScheduleInterviewModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  );
}

