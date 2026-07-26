import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-violet-600 to-emerald-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10 text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-3xl">IA</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Ace Your Next Interview
          </h2>
          <p className="text-lg text-white/80">
            AI-powered mock interviews, personalized roadmaps, and real-time feedback to land your dream job.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-white/60 text-sm">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white mb-1">AI</div>
              Mock Interviews
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white mb-1">93%</div>
              Success Rate
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white mb-1">10k+</div>
              Students
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

