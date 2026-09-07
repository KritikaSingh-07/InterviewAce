import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  User,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/ui/Modal';

interface Session {
  _id: string;
  student: any;
  mentor: any;
  studentName: string;
  mentorName: string;
  topic: string;
  studentMessage: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED_BY_STUDENT' | 'CANCELLED_BY_MENTOR' | 'COMPLETED' | 'NO_SHOW' | 'RESCHEDULE_REQUESTED';
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  meetingLink: string | null;
  rejectionReason: string | null;
  feedbackSubmitted?: boolean;
  rescheduleRequest?: {
    initiator: string;
    scheduledStart: string;
    scheduledEnd: string;
    reason: string;
  } | null;
}

interface Availability {
  _id: string;
  dayOfWeek?: string;
  date?: string;
  startTime: string;
  endTime: string;
  duration: number;
  timezone: string;
  isRecurring: boolean;
  status: string;
}

export default function SessionsDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isMentor = user?.role === 'mentor';
  const [activeTab, setActiveTab] = useState(isMentor ? 'requests' : 'upcoming');

  // Sessions Lists
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Availability Management (Mentor only)
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [isRecurringAvail, setIsRecurringAvail] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newDay, setNewDay] = useState('Monday');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [newDuration, setNewDuration] = useState(30);
  const [newTimezone, setNewTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');
  const [submittingAvail, setSubmittingAvail] = useState(false);

  // Actions states
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [meetLinkId, setMeetLinkId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState('');

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  useEffect(() => {
    fetchSessions();
    if (isMentor) {
      fetchAvailabilities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let statusParam = '';
      if (activeTab === 'upcoming') statusParam = 'CONFIRMED';
      if (activeTab === 'requests') statusParam = 'PENDING';
      if (activeTab === 'completed') statusParam = 'COMPLETED';
      if (activeTab === 'cancelled') statusParam = 'CANCELLED_BY_STUDENT'; // We'll fetch all matching roles in backend, statusParam is optional

      const { data } = await api.get(`/sessions?status=${statusParam}&page=${page}&limit=10`);
      setSessions(data.sessions || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load session logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async () => {
    setLoadingAvail(true);
    try {
      const { data } = await api.get('/mentor/availability');
      setAvailabilities(data.availability || []);
    } catch (error) {
      toast.error('Failed to fetch availability configurations.');
    } finally {
      setLoadingAvail(false);
    }
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAvail(true);
    try {
      const payload: any = {
        startTime: newStart,
        endTime: newEnd,
        duration: newDuration,
        timezone: newTimezone,
        isRecurring: isRecurringAvail,
      };

      if (isRecurringAvail) {
        payload.dayOfWeek = newDay;
      } else {
        if (!newDate) {
          toast.error('Please select a date');
          setSubmittingAvail(false);
          return;
        }
        payload.date = newDate;
      }

      await api.post('/mentor/availability', payload);
      toast.success('Availability configured successfully!');
      fetchAvailabilities();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add availability configuration.');
    } finally {
      setSubmittingAvail(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability configuration slot?')) return;
    try {
      await api.delete(`/mentor/availability/${id}`);
      toast.success('Availability slot removed.');
      fetchAvailabilities();
    } catch (error) {
      toast.error('Failed to delete availability.');
    }
  };

  // Session state updates
  const handleAccept = async (id: string) => {
    try {
      await api.patch(`/sessions/${id}/accept`);
      toast.success('Session request accepted!');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Accept failed.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId) return;
    try {
      await api.patch(`/sessions/${rejectId}/reject`, { reason: rejectReason });
      toast.success('Session request rejected.');
      setRejectId(null);
      setRejectReason('');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to reject session request.');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelId) return;
    try {
      await api.patch(`/sessions/${cancelId}/cancel`, { reason: cancelReason });
      toast.success('Session cancelled.');
      setCancelId(null);
      setCancelReason('');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to cancel session.');
    }
  };

  const handleAddMeetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetLinkId) return;
    try {
      await api.patch(`/sessions/${meetLinkId}/meeting-link`, { meetingLink: meetLink });
      toast.success('Google Meet link added!');
      setMeetLinkId(null);
      setMeetLink('');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add meeting link.');
    }
  };

  const handleCompleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to conclude and mark this session completed?')) return;
    try {
      await api.post(`/sessions/${id}/complete`);
      toast.success('Session marked completed!');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to complete session.');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) return;
    setSubmittingReschedule(true);
    try {
      await api.patch(`/sessions/${rescheduleId}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleTime,
        reason: rescheduleReason,
      });
      toast.success('Reschedule request proposed!');
      setRescheduleId(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to request reschedule.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleConfirmReschedule = async (id: string) => {
    try {
      await api.patch(`/sessions/${id}/confirm-reschedule`);
      toast.success('Reschedule confirmed successfully!');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to confirm reschedule.');
    }
  };

  // Countdown string calculator
  const getCountdownString = (startUtc: string) => {
    const diff = new Date(startUtc).getTime() - Date.now();
    if (diff <= 0) return 'Join Meeting Now';
    const totalMins = Math.floor(diff / 60000);
    const days = Math.floor(totalMins / (24 * 60));
    const hours = Math.floor((totalMins % (24 * 60)) / 60);
    const mins = totalMins % 60;

    if (days > 0) return `Starts in ${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `Starts in ${hours}h ${mins}m`;
    return `Starts in ${mins} minutes`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 p-8 glass-card">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sessions & Meetings Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isMentor ? 'Manage your availability configurations, meeting requests, and calendar slots.' : 'Track your session requests, confirm dates, and join mock interviews.'}
          </p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-gray-250 dark:border-gray-800 gap-6 text-sm font-semibold">
        {isMentor ? (
          <>
            <button
              onClick={() => { setActiveTab('requests'); setPage(1); }}
              className={`pb-3 transition-colors ${activeTab === 'requests' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900'}`}
            >
              Incoming Requests
            </button>
            <button
              onClick={() => { setActiveTab('upcoming'); setPage(1); }}
              className={`pb-3 transition-colors ${activeTab === 'upcoming' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900'}`}
            >
              Upcoming Sessions
            </button>
            <button
              onClick={() => { setActiveTab('completed'); setPage(1); }}
              className={`pb-3 transition-colors ${activeTab === 'completed' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900'}`}
            >
              Completed Sessions
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`pb-3 transition-colors ${activeTab === 'availability' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900'}`}
            >
              Availability Editor
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setActiveTab('upcoming'); setPage(1); }}
              className={`pb-3 transition-colors ${activeTab === 'upcoming' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900'}`}
            >
              Upcoming Meetings
            </button>
            <button
              onClick={() => { setActiveTab('requests'); setPage(1); }}
              className={`pb-3 transition-colors ${activeTab === 'requests' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900'}`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => { setActiveTab('completed'); setPage(1); }}
              className={`pb-3 transition-colors ${activeTab === 'completed' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900'}`}
            >
              Completed Sessions
            </button>
          </>
        )}
      </div>

      {/* Main View Area */}
      {activeTab === 'availability' && isMentor ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Availability Form */}
          <div className="glass-card p-6 h-fit space-y-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Add Availability Slot</h3>

            {/* Toggle Configuration Type */}
            <div className="flex bg-gray-105 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setIsRecurringAvail(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isRecurringAvail ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Date-Specific Slot
              </button>
              <button
                type="button"
                onClick={() => setIsRecurringAvail(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isRecurringAvail ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Weekly Recurring
              </button>
            </div>

            <form onSubmit={handleAddAvailability} className="space-y-4">
              {isRecurringAvail ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Weekday</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Select Date</label>
                  <input
                    type="date"
                    value={newDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Start Time (24h)</label>
                  <input
                    type="text"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    placeholder="e.g. 09:00"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">End Time (24h)</label>
                  <input
                    type="text"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    placeholder="e.g. 17:00"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Duration</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Timezone</label>
                  <input
                    type="text"
                    value={newTimezone}
                    onChange={(e) => setNewTimezone(e.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAvail}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 active:scale-[0.98]"
              >
                {submittingAvail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Availability
              </button>
            </form>
          </div>

          {/* List Availabilities */}
          <div className="col-span-2 glass-card p-6 space-y-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Your Configured Slots</h3>

            {loadingAvail ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : availabilities.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {availabilities.map((avail) => {
                  const isDateSpecific = !avail.isRecurring;

                  const formatTime12h = (time24: string) => {
                    if (!time24) return '';
                    const [hStr, mStr] = time24.split(':');
                    const h = parseInt(hStr);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const displayHour = h % 12 || 12;
                    return `${displayHour.toString().padStart(2, '0')}:${mStr} ${ampm}`;
                  };

                  const formatDateDisplay = (dateStr: string) => {
                    if (!dateStr) return '';
                    const parts = dateStr.split('-');
                    const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0));
                    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                  };

                  return (
                    <div key={avail._id} className="py-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">
                            {isDateSpecific && avail.date ? formatDateDisplay(avail.date) : avail.dayOfWeek}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDateSpecific ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                            {isDateSpecific ? 'Date-Specific' : 'Weekly Recurring'}
                          </span>
                          {isDateSpecific && avail.status?.toUpperCase() === 'BOOKED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                              Booked
                            </span>
                          )}
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold px-2 py-0.5 rounded-full">
                            {avail.duration} min slot
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-450 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatTime12h(avail.startTime)} - {formatTime12h(avail.endTime)} ({avail.timezone})
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAvailability(avail._id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-all active:scale-[0.95]"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-550 dark:text-gray-450 text-sm border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <Calendar className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                No active availability slot configurations created yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        // List Sessions View
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((sess) => {
                const partnerName = isMentor ? sess.studentName : sess.mentorName;
                const partnerImage = isMentor ? sess.student?.profileImage : sess.mentor?.profileImage;

                return (
                  <div
                    key={sess._id}
                    className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-shadow relative overflow-hidden"
                  >
                    {/* Reschedule alert flag */}
                    {sess.rescheduleRequest && (
                      <div className="absolute top-0 left-0 right-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-6 py-1.5 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Reschedule requested by {sess.rescheduleRequest.initiator.toString() === user?.id?.toString() ? 'you' : 'other party'} to {new Date(sess.rescheduleRequest.scheduledStart).toLocaleString(undefined, { timeZone: sess.timezone })} ({sess.timezone})
                        {sess.rescheduleRequest.initiator.toString() !== user?.id?.toString() && (
                          <button
                            onClick={() => handleConfirmReschedule(sess._id)}
                            className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                          >
                            Accept Reschedule
                          </button>
                        )}
                      </div>
                    )}

                    {/* Left: Partner detail & Meta */}
                    <div className="flex items-start gap-4">
                      {partnerImage ? (
                        <img
                          src={partnerImage}
                          alt={partnerName}
                          className="w-12 h-12 rounded-xl object-cover border dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {partnerName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                          {partnerName}
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            sess.status === 'CONFIRMED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            sess.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            sess.status === 'RESCHEDULE_REQUESTED' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400' :
                            'bg-gray-105 dark:bg-gray-800 text-gray-500'
                          }`}>
                            {sess.status.replace(/_/g, ' ')}
                          </span>
                        </h4>

                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{sess.topic}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-550 dark:text-gray-400 font-semibold pt-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-405" />
                            {new Date(sess.scheduledStart).toLocaleDateString(undefined, {
                              timeZone: sess.timezone,
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-405" />
                            {new Date(sess.scheduledStart).toLocaleTimeString([], {
                              timeZone: sess.timezone,
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(sess.scheduledEnd).toLocaleTimeString([], {
                              timeZone: sess.timezone,
                              hour: '2-digit',
                              minute: '2-digit'
                            })} ({sess.timezone})
                          </span>
                        </div>

                        {sess.studentMessage && (
                          <p className="text-xs text-gray-450 dark:text-gray-400 leading-relaxed italic bg-gray-50 dark:bg-gray-850 p-2.5 rounded-lg border border-gray-150 dark:border-gray-800 mt-2 max-w-lg">
                            "{sess.studentMessage}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 items-end justify-center">
                      {/* Countdown indicator */}
                      {sess.status === 'CONFIRMED' && (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                          {getCountdownString(sess.scheduledStart)}
                        </span>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Session Detail Query Link */}
                        <button
                          onClick={() => navigate(`/dashboard/sessions/${sess._id}`)}
                          className="h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center"
                        >
                          View Details
                        </button>

                        {/* Accept/Reject (Mentor requests tab only) */}
                        {isMentor && sess.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAccept(sess._id)}
                              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setRejectId(sess._id)}
                              className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Google Meet buttons */}
                        {sess.status === 'CONFIRMED' && (
                          <>
                            {sess.meetingLink ? (
                              <a
                                href={sess.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 px-4 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md transition-all animate-pulse flex items-center justify-center gap-1.5"
                              >
                                <Video className="w-3.5 h-3.5" /> Join Meet <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : isMentor ? (
                              <button
                                onClick={() => setMeetLinkId(sess._id)}
                                className="h-10 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all hover:scale-[1.02] flex items-center justify-center"
                              >
                                Add Meet Link
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic font-semibold flex items-center h-10 px-2">Waiting for Meet Link</span>
                            )}
                          </>
                        )}

                        {/* Complete session (Mentor only) */}
                        {isMentor && sess.status === 'CONFIRMED' && new Date(sess.scheduledEnd) <= new Date() && (
                          <button
                            onClick={() => handleCompleteSession(sess._id)}
                            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center"
                          >
                            Mark Completed
                          </button>
                        )}

                        {/* Reschedule trigger */}
                        {['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(sess.status) && (
                          <button
                            onClick={() => setRescheduleId(sess._id)}
                            className="h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center"
                          >
                            Reschedule
                          </button>
                        )}

                        {/* Cancellation trigger */}
                        {['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(sess.status) && (
                          <button
                            onClick={() => setCancelId(sess._id)}
                            className="h-10 px-4 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50/20 dark:hover:bg-red-950/20 text-xs font-semibold text-red-550 dark:text-red-400 transition-all active:scale-[0.95] flex items-center justify-center"
                          >
                            Cancel Session
                          </button>
                        )}

                        {/* Feedback (Completed only) */}
                        {sess.status === 'COMPLETED' && (
                          <>
                            {sess.feedbackSubmitted ? (
                              <span className="text-xs text-gray-400 font-bold uppercase bg-gray-50 dark:bg-gray-850 px-2.5 py-1 rounded">Feedback Sent</span>
                            ) : (
                              <button
                                onClick={() => navigate(`/dashboard/sessions/${sess._id}/feedback`)}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                              >
                                Submit Review
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 glass-card border border-dashed border-gray-250 dark:border-gray-850">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-750 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No sessions found in this category.
              </p>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-gray-500 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectId}
        onClose={() => {
          setRejectId(null);
          setRejectReason('');
        }}
        title="Reject Session Request"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Specify the reason for rejection (optional)..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setRejectId(null);
                setRejectReason('');
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 h-10 flex items-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold h-10 flex items-center"
            >
              Confirm Reject
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={!!cancelId}
        onClose={() => {
          setCancelId(null);
          setCancelReason('');
        }}
        title="Cancel Session Booking"
        description="Are you sure you want to cancel this meeting slot? This action will notify the other participant."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Optionally specify the reason for cancellation..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setCancelId(null);
                setCancelReason('');
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors h-10 flex items-center"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors h-10 flex items-center"
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </Modal>

      {/* Meet Link Modal */}
      <Modal
        isOpen={!!meetLinkId}
        onClose={() => {
          setMeetLinkId(null);
          setMeetLink('');
        }}
        title="Add Google Meet Link"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddMeetLink} className="space-y-4">
          <input
            type="text"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setMeetLinkId(null);
                setMeetLink('');
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 h-10 flex items-center"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 flex items-center"
            >
              Save Link
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleId}
        onClose={() => {
          setRescheduleId(null);
          setRescheduleReason('');
          setRescheduleDate('');
          setRescheduleTime('');
        }}
        title="Request Reschedule"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">New Date</label>
            <input
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">New Start Time (24h)</label>
            <input
              type="text"
              value={rescheduleTime}
              placeholder="e.g. 14:00"
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Reason</label>
            <textarea
              value={rescheduleReason}
              placeholder="Specify the reason for rescheduling..."
              rows={2}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setRescheduleId(null);
                setRescheduleReason('');
                setRescheduleDate('');
                setRescheduleTime('');
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 h-10 flex items-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReschedule}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 flex items-center justify-center min-w-[130px]"
            >
              {submittingReschedule ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Propose Reschedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
