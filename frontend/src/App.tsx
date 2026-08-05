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
import ProfileSetup from './pages/ProfileSetup';
import RoadmapGenerator from './pages/roadmap/RoadmapGenerator';
import RoadmapDetail from './pages/roadmap/RoadmapDetail';
import MockInterview from './pages/interview/MockInterview';
import InterviewSession from './pages/interview/InterviewSession';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';

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
          <Route index element={<Dashboard />} />
          <Route path="profile-setup" element={<ProfileSetup />} />
          <Route path="roadmaps" element={<RoadmapGenerator />} />
          <Route path="roadmaps/:id" element={<RoadmapDetail />} />
          <Route path="interviews" element={<MockInterview />} />
          <Route path="interviews/:id" element={<InterviewSession />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="settings" element={<Settings />} />
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

