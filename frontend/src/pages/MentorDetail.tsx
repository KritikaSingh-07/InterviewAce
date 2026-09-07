import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Linkedin,
  Loader2,
  Briefcase,
  GraduationCap,
  Star,
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import api from '../lib/api';
import ScheduleSessionModal from '../components/mentor/ScheduleSessionModal';
import Modal from '../components/ui/Modal';

interface ReviewData {
  _id: string;
  reviewerName: string;
  reviewerImage?: string;
  overallRating: number;
  communication: number;
  professionalism: number;
  knowledge: number;
  helpfulness: number;
  comment: string;
  createdAt: string;
}

interface MentorDetailData {
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
  reviews: ReviewData[];
}

interface TimeSlot {
  availabilitySlotId?: string;
  startTime: string;
  endTime: string;
  startUtc: string;
  endUtc: string;
  status: 'Available' | 'Booked' | 'Unavailable' | 'Requested';
  duration: number;
}

export default function MentorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState<MentorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Weekly availability states
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<any[]>([]);
  const [weeklyTimezone, setWeeklyTimezone] = useState('Asia/Calcutta');
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');

  const fetchWeeklyAvailability = async () => {
    setLoadingWeekly(true);
    setWeeklyError('');
    try {
      const { data } = await api.get(`/mentors/${id}/weekly-availability`);
      setWeeklyAvailability(data.weeklyAvailability || []);
      setWeeklyTimezone(data.timezone || 'Asia/Calcutta');
    } catch (error: any) {
      console.error('Failed to load weekly availability:', error);
      setWeeklyError('Unable to load weekly schedule. Please try again.');
    } finally {
      setLoadingWeekly(false);
    }
  };

  const handleOpenWeeklySchedule = () => {
    setWeeklyOpen(true);
    if (weeklyAvailability.length === 0 && !loadingWeekly) {
      fetchWeeklyAvailability();
    }
  };

  const handleSelectDayOfWeek = (dayName: string) => {
    setWeeklyOpen(false);

    // Find the next occurrence of this weekday (including today if it matches)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = days.indexOf(dayName);
    if (targetDayIndex === -1) return;

    const today = new Date();
    const currentDayIndex = today.getDay();

    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd < 0) {
      daysToAdd += 7; // Wrap to next week
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');

    setDate(`${yyyy}-${mm}-${dd}`);
    toast.success(`Selected the next available ${dayName} (${dd}-${mm}-${yyyy})`);
  };

  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${mStr} ${ampm}`;
  };

  // Set default date to today in local YYYY-MM-DD
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch mentor profile details
  useEffect(() => {
    if (id) {
      fetchMentorDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch slots whenever selected date updates
  useEffect(() => {
    if (id && date) {
      fetchAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, date]);

  const fetchMentorDetails = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/mentors/${id}`);
      setMentor(data.mentor);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load mentor details.');
      navigate('/dashboard/mentors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const { data } = await api.get(`/mentors/${id}/availability?date=${date}`);
      setSlots(data.slots || []);
    } catch (error: any) {
      console.error('Failed to load slots:', error);
      toast.error('Failed to compute available meeting slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading mentor profile details...</p>
      </div>
    );
  }

  if (!mentor) return null;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard/mentors')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Mentors
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Details & Reviews */}
        <div className="col-span-1 lg:col-span-2 space-y-8">

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 flex flex-col md:flex-row gap-6 items-start"
          >
            {mentor.profileImage ? (
              <img
                src={mentor.profileImage}
                alt={mentor.fullName}
                className="w-24 h-24 rounded-3xl object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-4xl flex-shrink-0">
                {mentor.fullName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {mentor.fullName}
                </h1>
                {mentor.linkedin && (
                  <a
                    href={mentor.linkedin.startsWith('http') ? mentor.linkedin : `https://${mentor.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn Profile
                  </a>
                )}
              </div>

              <h2 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {mentor.designation} @ {mentor.company}
              </h2>

              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  {mentor.experience}+ years experience
                </span>
                <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded text-amber-700 dark:text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {mentor.rating > 0 ? `${mentor.rating} (${mentor.reviewsCount} reviews)` : 'No ratings'}
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {mentor.completedSessions} completed sessions
                </span>
              </div>

              <p className="text-sm text-gray-650 dark:text-gray-355 leading-relaxed pt-2">
                {mentor.bio}
              </p>
            </div>
          </motion.div>

          {/* Skills & Expertise */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 space-y-4"
          >
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Reviews List */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 space-y-6"
          >
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Student Feedback ({mentor.reviews.length})
            </h3>

            {mentor.reviews.length > 0 ? (
              <div className="space-y-6 divide-y divide-gray-100 dark:divide-gray-800">
                {mentor.reviews.map((review, i) => (
                  <div key={review._id} className={`pt-6 ${i === 0 ? 'pt-0' : ''} space-y-3`}>
                    <div className="flex items-center gap-3">
                      {review.reviewerImage ? (
                        <img
                          src={review.reviewerImage}
                          alt={review.reviewerName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
                          {review.reviewerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                            {review.reviewerName}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${star <= review.overallRating ? 'fill-current' : 'opacity-30'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-450 leading-relaxed italic pl-11">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No session feedback reviews written yet. Be the first to leave a review!
              </div>
            )}
          </motion.div>

        </div>

        {/* Right Column: Time Scheduling Calendar slots */}
        <div className="col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 space-y-6 sticky top-24"
          >
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Schedule Meeting
            </h3>

            {/* Date Select input */}
            <div className="space-y-2">
              <label htmlFor="booking-date" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Select Date
              </label>
              <input
                id="booking-date"
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-sm"
              />
            </div>

            <button
              onClick={handleOpenWeeklySchedule}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-100 dark:border-gray-800 bg-indigo-50/15 dark:bg-indigo-500/5 text-indigo-650 dark:text-indigo-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50/30 hover:scale-[1.01] transition-all active:scale-[0.98]"
            >
              <Calendar className="w-3.5 h-3.5" />
              Weekly Schedule
            </button>

            {/* Availability Slots Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Available Time Slots
              </h4>

              {loadingSlots ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <span className="text-xs text-gray-400">Computing slots...</span>
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const isAvailable = slot.status === 'Available';
                    const isBooked = slot.status === 'Booked';
                    const isRequested = slot.status === 'Requested';

                    return (
                      <button
                        key={slot.startUtc}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isAvailable
                            ? 'border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50/20 dark:border-gray-800 dark:hover:border-indigo-500/50 text-gray-850 dark:text-gray-200 hover:scale-[1.01]'
                            : isBooked
                            ? 'border-gray-200 bg-gray-50/50 dark:border-gray-850 dark:bg-gray-850/20 text-gray-400 cursor-not-allowed opacity-50'
                            : isRequested
                            ? 'border-amber-100 bg-amber-50/15 dark:border-amber-950/20 dark:bg-amber-950/5 text-amber-500 cursor-not-allowed opacity-75'
                            : 'border-red-100 bg-red-50/15 dark:border-red-950/20 dark:bg-red-950/5 text-red-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs font-bold">
                          <Clock className={`w-3.5 h-3.5 ${isAvailable ? 'text-indigo-500' : isRequested ? 'text-amber-500' : 'text-gray-400'}`} />
                          {slot.startTime} - {slot.endTime}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isAvailable
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : isBooked
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            : isRequested
                            ? 'bg-amber-55 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                        }`}>
                          {isBooked ? 'Confirmed' : isRequested ? 'Requested' : slot.status === 'Unavailable' ? 'Past' : slot.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center gap-2 bg-gray-50/50 dark:bg-gray-850/20 rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-850">
                  <AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-650" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No configurations scheduled for this day of week.
                  </p>
                </div>
              )}
            </div>

            {/* Note info */}
            <div className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-850 rounded-xl p-3 leading-relaxed flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                Meetings default to Google Meet. You will see the Join link immediately once the mentor confirms your session request.
              </span>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Booking Dialog Modal */}
      {selectedSlot && (
        <ScheduleSessionModal
          mentorId={mentor._id}
          mentorName={mentor.fullName}
          mentorImage={mentor.profileImage}
          dateStr={date}
          startTimeStr={selectedSlot.startTime}
          duration={selectedSlot.duration}
          availabilitySlotId={selectedSlot.availabilitySlotId}
          onClose={() => setSelectedSlot(null)}
          onSuccess={() => {
            fetchAvailableSlots();
            setSelectedSlot(null);
          }}
        />
      )}

      {/* Weekly Schedule Modal */}
      <Modal
        isOpen={weeklyOpen}
        onClose={() => setWeeklyOpen(false)}
        title="Mentor's Weekly Schedule"
        description="Recurring availability"
        maxWidth="max-w-md"
      >
        {loadingWeekly ? (
          <div className="flex flex-col items-center py-12 gap-2 justify-center">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="text-xs text-gray-400">Loading weekly schedule...</span>
          </div>
        ) : weeklyError ? (
          <div className="flex flex-col items-center py-8 text-center text-red-500 gap-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-xs font-semibold">{weeklyError}</span>
            <button
              onClick={fetchWeeklyAvailability}
              className="mt-2 text-xs font-bold text-indigo-650 hover:text-indigo-500 underline"
            >
              Try Again
            </button>
          </div>
        ) : weeklyAvailability.length > 0 ? (
          <div className="space-y-5">
            {weeklyAvailability.map((dayInfo) => (
              <div key={dayInfo.day} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  {dayInfo.day}
                </h4>

                {dayInfo.slots && dayInfo.slots.length > 0 ? (
                  <div className="space-y-2">
                    {dayInfo.slots.map((slot: any) => (
                      <button
                        key={slot._id}
                        onClick={() => handleSelectDayOfWeek(dayInfo.day)}
                        className="w-full text-left p-3 rounded-xl border border-indigo-50/50 dark:border-indigo-950/20 bg-indigo-50/5 dark:bg-indigo-950/5 hover:border-indigo-500 hover:bg-indigo-50/15 dark:hover:border-indigo-500/10 transition-all group flex flex-col gap-1 hover:scale-[1.01]"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-gray-850 dark:text-gray-200">
                          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)}
                          </span>
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                            {slot.duration} min sessions
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 italic mt-0.5">
                          Timezone: {slot.timezone || weeklyTimezone}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-550 italic pl-3">
                    Not Available
                  </p>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setWeeklyOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
            This mentor has not configured a recurring weekly schedule.
          </div>
        )}
      </Modal>
    </div>
  );
}
