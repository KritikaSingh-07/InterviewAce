import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Layout
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/dashboard/Dashboard';
import MentorDashboard from './pages/dashboard/MentorDashboard';
import MentorStudents from './pages/dashboard/MentorStudents';
import MentorSessions from './pages/dashboard/MentorSessions';
import MentorFeedback from './pages/dashboard/MentorFeedback';
import ProfileSetup from './pages/ProfileSetup';
import RoadmapGenerator from './pages/roadmap/RoadmapGenerator';
import RoadmapDetail from './pages/roadmap/RoadmapDetail';
import MockInterview from './pages/interview/MockInterview';
import InterviewSession from './pages/interview/InterviewSession';
import Leaderboard from './pages/Leaderboard';
import Mentors from './pages/Mentors';
import BillingPage from './pages/BillingPage';

// Onboarding Pages
import RoleSelectionPage from './pages/onboarding/RoleSelectionPage';
import StudentOnboardingPage from './pages/onboarding/StudentOnboardingPage';
import MentorOnboardingPage from './pages/onboarding/MentorOnboardingPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding/role" replace />;
  }
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// Role-aware dashboard index: renders MentorDashboard for mentors, student Dashboard otherwise
function DashboardIndex() {
  const { user } = useAuthStore();
  if (user?.role === 'mentor') {
    return <MentorDashboard />;
  }
  return <Dashboard />;
}

// Guards student-only routes from mentors
function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user && user.role === 'mentor') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// Guards mentor-only routes from students
function MentorRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user && user.role !== 'mentor') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// Guards the Mentor Section route for students. Mentors are kept out.
// Non-Pro/Agency students are allowed through so the Mentors page can render
// the locked state with the "Upgrade Now" CTA.
function MentorSectionRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user && user.role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function App() {
  const { fetchUser, isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#1f2937' : '#fff',
            color: isDarkMode ? '#f3f4f6' : '#111827',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Onboarding Routes */}
        <Route
          path="/onboarding/role"
          element={
            <OnboardingRoute>
              <RoleSelectionPage />
            </OnboardingRoute>
          }
        />
        <Route
          path="/onboarding/student"
          element={
            <OnboardingRoute>
              <StudentOnboardingPage />
            </OnboardingRoute>
          }
        />
        <Route
          path="/onboarding/mentor"
          element={
            <OnboardingRoute>
              <MentorOnboardingPage />
            </OnboardingRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardIndex />} />
          <Route path="profile-setup" element={<StudentRoute><ProfileSetup /></StudentRoute>} />
          <Route path="roadmaps" element={<StudentRoute><RoadmapGenerator /></StudentRoute>} />
          <Route path="roadmaps/:id" element={<StudentRoute><RoadmapDetail /></StudentRoute>} />
          <Route path="interviews" element={<StudentRoute><MockInterview /></StudentRoute>} />
          <Route path="interviews/:id" element={<StudentRoute><InterviewSession /></StudentRoute>} />
<Route path="leaderboard" element={<StudentRoute><Leaderboard /></StudentRoute>} />
          <Route path="mentors" element={<MentorSectionRoute><Mentors /></MentorSectionRoute>} />
          <Route path="billing" element={<StudentRoute><BillingPage /></StudentRoute>} />
          <Route path="students" element={<MentorRoute><MentorStudents /></MentorRoute>} />
          <Route path="sessions" element={<MentorRoute><MentorSessions /></MentorRoute>} />
<Route path="feedback" element={<MentorRoute><MentorFeedback /></MentorRoute>} />
          <Route path="settings" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

