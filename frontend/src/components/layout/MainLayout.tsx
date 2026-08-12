import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Route,
  BotMessageSquare,
  Trophy,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  Bell,
  UserCircle2,
  Users,
  ClipboardList,
  MessageSquareText,
  CreditCard,
} from 'lucide-react';

const studentSidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/roadmaps', icon: Route, label: 'Roadmaps' },
  { to: '/dashboard/interviews', icon: BotMessageSquare, label: 'Mock Interviews' },
  { to: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/dashboard/mentors', icon: Users, label: 'Mentors' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
];

const mentorSidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/students', icon: Users, label: 'Students' },
  { to: '/dashboard/sessions', icon: ClipboardList, label: 'Sessions' },
  { to: '/dashboard/feedback', icon: MessageSquareText, label: 'Feedback' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggle } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

const isMentor = user?.role === 'mentor';

  // Mentors section is visible to all students. For non-Pro/Agency students,
  // the Mentors page itself renders a locked state with an "Upgrade Now" CTA.
  // (Already hidden from mentors who use the mentor sidebar.)
  const sidebarLinks = isMentor ? mentorSidebarLinks : studentSidebarLinks;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className={`fixed left-0 top-0 h-full z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
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
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm truncate">{link.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="activeTab"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"
                    />
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
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-105 dark:hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-655 dark:text-red-450 hover:bg-red-50 dark:hover:bg-red-955/20 transition-colors"
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}

