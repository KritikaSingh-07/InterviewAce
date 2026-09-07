import { useEffect, useState, useRef } from 'react';
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
  Star,
  Sparkles,
  CalendarDays,
  Filter,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface MentorCardData {
  _id: string;
  fullName: string;
  designation: string;
  company: string;
  experience: number;
  skills: string[];
  linkedin?: string;
  bio: string;
  profileImage?: string;
  rating: number;
  reviewsCount: number;
  completedSessions: number;
  hasAvailability: boolean;
}

const LOCKED_MESSAGE = 'This feature is locked. To unlock this, upgrade to Pro or Agency.';
const isEligiblePlan = (plan?: string) => plan === 'pro' || plan === 'agency';

export default function Mentors() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [mentors, setMentors] = useState<MentorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [experience, setExperience] = useState('');
  const [minRating, setMinRating] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const eligible = isEligiblePlan(user?.plan);
  const searchTimeoutRef = useRef<any>(null);

  // Debounced fetch
  useEffect(() => {
    if (!eligible) {
      setLoading(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchMentors();
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, search, experience, minRating, skillFilter, page]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (experience) params.append('experience', experience);
      if (minRating) params.append('rating', minRating);
      if (skillFilter.trim()) params.append('skills', skillFilter.trim());
      params.append('page', page.toString());
      params.append('limit', '6');

      const { data } = await api.get(`/mentors?${params.toString()}`);
      setMentors(data.mentors || []);
      setTotalPages(data.totalPages || 1);
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
          onClick={() => navigate('/dashboard/billing')}
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
      {/* Header & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mentor Discovery
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Book 1-on-1 meeting slots or structured sessions with verified industry experts.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/sessions')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold transition-all active:scale-[0.98]"
          >
            <CalendarClock className="w-4.5 h-4.5" />
            My Bookings
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, title, bio or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div>
            <select
              value={experience}
              onChange={(e) => { setExperience(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            >
              <option value="">All Experience Levels</option>
              <option value="2">2+ Years Experience</option>
              <option value="5">5+ Years Experience</option>
              <option value="10">10+ Years Experience</option>
            </select>
          </div>

          <div>
            <select
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            >
              <option value="">All Ratings</option>
              <option value="4">4.0+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Mentor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="glass-card p-6 h-[340px] animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-full mt-6" />
            </div>
          ))}
        </div>
      ) : mentors.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor, i) => (
              <motion.div
                key={mentor._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="glass-card p-6 flex flex-col h-full hover:shadow-xl transition-all duration-300 relative group overflow-hidden border border-gray-150 dark:border-gray-800"
              >
                {/* Active Availability Tag */}
                {mentor.hasAvailability && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Available Now
                  </span>
                )}

                {/* Profile Meta */}
                <div className="flex items-start gap-4 mb-4">
                  {mentor.profileImage ? (
                    <img
                      src={mentor.profileImage}
                      alt={mentor.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                      {mentor.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 pr-10">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-base hover:text-indigo-600 transition-colors">
                      {mentor.fullName}
                    </h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium truncate">
                      {mentor.designation}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1 truncate">
                      <Briefcase className="w-3 h-3" /> {mentor.company}
                    </p>
                  </div>
                </div>

                {/* Aggregated ratings and completions */}
                <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-gray-650 dark:text-gray-400">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg text-amber-700 dark:text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {mentor.rating > 0 ? `${mentor.rating} (${mentor.reviewsCount} reviews)` : 'No ratings'}
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    {mentor.completedSessions} sessions
                  </div>
                </div>

                {/* Expertise/Tags */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {mentor.experience}+ yrs exp
                  </span>
                </div>

                {/* Skills Preview */}
                {mentor.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mentor.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-850 text-gray-600 dark:text-gray-400 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {mentor.skills.length > 4 && (
                      <span className="text-[10px] text-gray-400 font-semibold self-center">
                        +{mentor.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Short Bio */}
                <p className="text-xs text-gray-500 dark:text-gray-400 flex-1 line-clamp-3 mb-6 leading-relaxed">
                  {mentor.bio || 'Experienced professional ready to mentor you through code reviews, design challenges, and interviews.'}
                </p>

                {/* Action CTA */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => navigate(`/dashboard/mentors/${mentor._id}`)}
                    className="w-full h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all flex items-center justify-center"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/mentors/${mentor._id}`)}
                    className="w-full h-10 px-4 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition-all active:scale-[0.98] flex items-center justify-center"
                  >
                    Request Session
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-450 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 glass-card border-2 border-dashed border-gray-250 dark:border-gray-700">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
          <h3 className="font-bold text-gray-800 dark:text-white text-base">No Mentors Found</h3>
          <p className="text-gray-550 dark:text-gray-400 text-xs mt-1">
            {search ? 'Try adjusting your search query or filters.' : 'There are currently no registered mentors available.'}
          </p>
        </div>
      )}
    </div>
  );
}
