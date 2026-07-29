import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import RoleCard from '../../components/onboarding/RoleCard';

export default function RoleSelectionPage() {
  const { user, setUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const { data } = await api.post('/users/select-role', { role: selectedRole });
      if (user) {
        // Sync role change to auth store
        setUser({
          ...user,
          role: selectedRole,
        });
      }
      toast.success(data.message || 'Role saved successfully');
      
      if (selectedRole === 'student') {
        navigate('/onboarding/student');
      } else {
        navigate('/onboarding/mentor');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save role selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl w-full space-y-8 flex flex-col items-center">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            Getting Started
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            How would you like to use <span className="gradient-text">InterviewAce</span>?
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm sm:text-base">
            Choose your path to begin customizing your interview preparation and placement tools.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl"
        >
          <RoleCard
            title="Student"
            description="Prepare for placements, practice interviews, generate AI roadmaps and improve your skills."
            icon="student"
            selected={selectedRole === 'student'}
            onClick={() => setSelectedRole('student')}
          />
          <RoleCard
            title="Mentor"
            description="Guide students, conduct interviews and share your expertise."
            icon="mentor"
            selected={selectedRole === 'mentor'}
            onClick={() => setSelectedRole('mentor')}
          />
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-xs pt-4"
        >
          <button
            type="button"
            disabled={!selectedRole || loading}
            onClick={handleContinue}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
