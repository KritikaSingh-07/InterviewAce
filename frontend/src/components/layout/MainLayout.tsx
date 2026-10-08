import { useOutlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { connectSocket, disconnectSocket, getSocket } from '../../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../ui/AnimatedBackground';
import ThemeToggle from '../ui/ThemeToggle';
import {
  LayoutDashboard,
  Route,
  BotMessageSquare,
  Trophy,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  UserCircle2,
  CheckCheck,
  Sparkles,
  BellOff,
  CheckCircle2,
  Users,
  ClipboardList,
  MessageSquareText,
  CreditCard,
  Wallet,
  Building2,
  Calendar,
  Trash2,
} from 'lucide-react';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    sessionId?: string;
    requestId?: string;
  };
}

const studentSidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/roadmaps', icon: Route, label: 'Roadmaps' },
  { to: '/dashboard/interviews', icon: BotMessageSquare, label: 'Mock Interviews' },
  { to: '/dashboard/tutor', icon: Sparkles, label: 'AI Coding Tutor' },
  { to: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/dashboard/mentors', icon: Users, label: 'Mentors' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
];

const mentorSidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/sessions', icon: ClipboardList, label: 'Sessions' },
  { to: '/dashboard/feedback', icon: MessageSquareText, label: 'Feedback' },
  { to: '/dashboard/earnings', icon: Wallet, label: 'Earnings' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  // Captured per render so the exiting page keeps its own content during the transition
  const outlet = useOutlet();
  const navigate = useNavigate();
  const prevUnreadRef = useRef(0);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      const fetched: NotificationItem[] = data.notifications || [];
      const newUnread: number = data.unreadCount || 0;

      // Toast for any brand-new unread notification
      fetched.forEach((n) => {
        if (!n.read && !prevIdsRef.current.has(n._id)) {
          toast(n.title, {
            icon: '🔔',
            duration: 4000,
            style: { fontWeight: '600' },
          });
        }
      });

      prevIdsRef.current = new Set(fetched.map((n) => n._id));
      prevUnreadRef.current = newUnread;
      setNotifications(fetched);
      setUnreadCount(newUnread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 s so roadmap / interview notifications appear quickly
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);

      const socket = getSocket();

      // Listen for socket notification events
      socket.on('notification:received', (newNotif: NotificationItem) => {
        setNotifications((prev) => {
          // Prevent duplicates
          if (prev.some((n) => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        toast(newNotif.title, {
          icon: '🔔',
          duration: 4000,
          style: { fontWeight: '600' },
        });
      });

      const handleUpdate = () => {
        fetchNotifications();
      };

      socket.on('session:reminder', handleUpdate);
      socket.on('session:request', handleUpdate);
      socket.on('session:accepted', handleUpdate);
      socket.on('session:rejected', handleUpdate);
      socket.on('session:cancelled', handleUpdate);
      socket.on('session:completed', handleUpdate);
      socket.on('feedback:submitted', handleUpdate);

      return () => {
        socket.off('notification:received');
        socket.off('session:reminder', handleUpdate);
        socket.off('session:request', handleUpdate);
        socket.off('session:accepted', handleUpdate);
        socket.off('session:rejected', handleUpdate);
        socket.off('session:cancelled', handleUpdate);
        socket.off('session:completed', handleUpdate);
        socket.off('feedback:submitted', handleUpdate);
        disconnectSocket();
      };
    }
  }, [user?.id, fetchNotifications]);


  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const targetNotif = notifications.find((n) => n._id === id);
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (targetNotif && !targetNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

const isMentor = user?.role === 'mentor';

  // Mentors section is visible to all students. For non-Pro/Agency students,
  // the Mentors page itself renders a locked state with an "Upgrade Now" CTA.
  // (Already hidden from mentors who use the mentor sidebar.)
  const sidebarLinks = isMentor ? mentorSidebarLinks : studentSidebarLinks;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative isolate min-h-screen bg-gray-50/60 dark:bg-gray-950 flex">
      <AnimatedBackground />
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className={`fixed left-0 top-0 h-full z-50 bg-white/80 dark:bg-gray-900/70 backdrop-blur-2xl border-r border-gray-200/70 dark:border-white/[0.06] shadow-xl shadow-gray-900/[0.03]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 bg-[length:200%_200%] animate-gradient shadow-lg shadow-indigo-900/30 flex items-center justify-center flex-shrink-0"
              >
                <span className="text-white font-bold text-lg font-display">IA</span>
              </motion.div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h1 className="text-lg font-bold gradient-text">InterviewAce</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI Interview Coach</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200 group
                    ${isActive
                      ? 'text-indigo-800 dark:text-violet-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-transparent dark:from-indigo-500/20 dark:via-violet-500/10 border border-indigo-500/20 dark:border-violet-500/25"
                    >
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                    </motion.div>
                  )}
                  <link.icon className="relative w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  {!collapsed && (
                    <span className="relative text-sm truncate">{link.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
            {/* Collapse button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* User info */}
            <div className={`flex items-center gap-3 p-2 ${collapsed ? 'justify-center' : ''}`}>
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user?.profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.profile?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen ${collapsed ? 'lg:ml-20' : 'lg:ml-72'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-950/60 backdrop-blur-xl border-b border-gray-200/70 dark:border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <motion.h2
                key={location.pathname}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-lg font-semibold text-gray-900 dark:text-white capitalize"
              >
                {(() => {
                  const segments = location.pathname.split('/').filter(Boolean);
                  const last = segments[segments.length - 1];
                  const secondLast = segments[segments.length - 2];
                  // If the last segment looks like a MongoDB ObjectId (24 hex chars), show parent name instead
                  const isId = /^[a-f0-9]{24}$/.test(last);
                  if (isId) {
                    if (secondLast === 'roadmaps') return 'Roadmap Detail';
                    if (secondLast === 'interviews') return 'Interview Session';
                    return secondLast?.replace(/-/g, ' ') || 'Detail';
                  }
                  return last?.replace(/-/g, ' ') || 'Dashboard';
                })()}
              </motion.h2>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setNotifOpen((o) => !o); }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <>
                      {/* Invisible backdrop: click anywhere outside closes the panel */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setNotifOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-80 max-h-96 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl z-50 overflow-hidden flex flex-col"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                              <span className="text-xs font-bold bg-indigo-500 text-white rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                                {unreadCount}
                              </span>
                            )}
                          </span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
                              <BellOff className="w-8 h-8 mb-2" />
                              <p className="text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const isRoadmap = n.type === 'roadmap_generated';
                              const isInterview = n.type === 'interview_started' || n.type === 'interview_completed';
                              return (
                                  <div
                                    key={n._id}
                                    onClick={() => {
                                      if (!n.read) handleMarkAsRead(n._id);
                                      setNotifOpen(false);
                                      if (isMentor) {
                                        navigate('/dashboard/sessions');
                                      } else if (n.data?.sessionId) {
                                        navigate(`/dashboard/sessions/${n.data.sessionId}`);
                                      } else {
                                        navigate('/dashboard/sessions');
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-3 items-start cursor-pointer group relative ${
                                      !n.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''
                                    }`}
                                  >
                                  <div className="mt-0.5 flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                      n.read ? 'bg-gray-100 dark:bg-gray-800' : (
                                        isRoadmap ? 'bg-violet-100 dark:bg-violet-500/20' :
                                        isInterview ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                                        'bg-indigo-100 dark:bg-indigo-500/20'
                                      )
                                    }`}>
                                      {isRoadmap ? (
                                        <Route className={`w-4 h-4 ${n.read ? 'text-gray-400' : 'text-violet-500'}`} />
                                      ) : isInterview ? (
                                        <BotMessageSquare className={`w-4 h-4 ${n.read ? 'text-gray-400' : 'text-emerald-500'}`} />
                                      ) : (
                                        <Sparkles className={`w-4 h-4 ${n.read ? 'text-gray-400' : 'text-indigo-500'}`} />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                      {n.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                      {n.message}
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                      {timeAgo(n.createdAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                    {!n.read && (
                                      <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 animate-pulse" />
                                    )}
                                    <button
                                      type="button"
                                      title="Delete notification"
                                      onClick={(e) => handleDeleteNotification(e, n._id)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.profile?.fullName || 'User avatar'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {user?.profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl z-50 py-1 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/dashboard/billing');
                          }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span>Billing & Plan</span>
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/profile');
                          }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <UserCircle2 className="w-4 h-4 text-gray-400" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">Logout</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

