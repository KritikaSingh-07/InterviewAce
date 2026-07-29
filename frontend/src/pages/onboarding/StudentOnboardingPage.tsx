import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ArrowRight, Save, User as UserIcon, BookOpen, Building, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

// Components
import ProgressBar from '../../components/onboarding/ProgressBar';
import StepIndicator from '../../components/onboarding/StepIndicator';
import CareerCard from '../../components/onboarding/CareerCard';
import CompanyChipSelector from '../../components/onboarding/CompanyChipSelector';
import SkillRating from '../../components/onboarding/SkillRating';
import ReviewCard from '../../components/onboarding/ReviewCard';

const STEP_NAMES = [
  'Basic Information',
  'Career Goal',
  'Target Companies',
  'Self Assessment',
  'Review & Finish',
];

const CAREER_GOALS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI Engineer',
  'Data Scientist',
  'Cyber Security Engineer',
  'DevOps Engineer',
  'Product Manager',
];

export default function StudentOnboardingPage() {
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    fullName: user?.profile?.fullName || '',
    college: '',
    degree: '',
    branch: '',
    year: 1,
  });

  const [careerGoal, setCareerGoal] = useState<string>('');
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [skillsRating, setSkillsRating] = useState<Record<string, number>>({
    'Data Structures & Algorithms': 0,
    'System Design': 0,
    'Coding Proficiency': 0,
    'Communication Skills': 0,
  });

  const totalSteps = 5;

  const handleNext = () => {
    // Validate Current Step
    if (currentStep === 1) {
      if (!basicInfo.fullName.trim() || !basicInfo.college.trim() || !basicInfo.degree.trim() || !basicInfo.branch.trim()) {
        toast.error('Please fill out all required fields');
        return;
      }
    } else if (currentStep === 2) {
      if (!careerGoal) {
        toast.error('Please select a career goal');
        return;
      }
    } else if (currentStep === 3) {
      if (targetCompanies.length === 0) {
        toast.error('Please select or add at least one target company');
        return;
      }
    } else if (currentStep === 4) {
      const anyUnrated = Object.values(skillsRating).some((r) => r === 0);
      if (anyUnrated) {
        toast.error('Please rate all assessment categories');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        fullName: basicInfo.fullName,
        college: basicInfo.college,
        degree: basicInfo.degree,
        branch: basicInfo.branch,
        year: Number(basicInfo.year),
        careerGoal,
        targetCompanies,
        selfAssessment: skillsRating,
      };

      await api.post('/student-profile', payload);
      await fetchUser(); // Reload user state
      toast.success('Onboarding completed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete student onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Onboarding Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Student Onboarding
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-md">
              Student Path
            </span>
          </div>
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepNames={STEP_NAMES} />
        </div>

        {/* Form Container */}
        <div className="glass-card p-6 sm:p-8 min-h-[400px] flex flex-col justify-between">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-indigo-500" /> Basic Information
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Let's set up your profile name, university details, and current program.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={basicInfo.fullName}
                        onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                        className="input-field"
                        placeholder="e.g. Jane Doe"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        College / University *
                      </label>
                      <input
                        type="text"
                        value={basicInfo.college}
                        onChange={(e) => setBasicInfo({ ...basicInfo, college: e.target.value })}
                        className="input-field"
                        placeholder="e.g. Stanford University"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Degree *
                      </label>
                      <input
                        type="text"
                        value={basicInfo.degree}
                        onChange={(e) => setBasicInfo({ ...basicInfo, degree: e.target.value })}
                        className="input-field"
                        placeholder="e.g. Bachelor of Science"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Branch / Specialization *
                      </label>
                      <input
                        type="text"
                        value={basicInfo.branch}
                        onChange={(e) => setBasicInfo({ ...basicInfo, branch: e.target.value })}
                        className="input-field"
                        placeholder="e.g. Computer Science"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Current Year *
                      </label>
                      <select
                        value={basicInfo.year}
                        onChange={(e) => setBasicInfo({ ...basicInfo, year: Number(e.target.value) })}
                        className="input-field appearance-none cursor-pointer"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                        <option value={5}>5th Year / Dual Degree</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" /> Career Goal
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Select the primary engineering or product role you are preparing for.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {CAREER_GOALS.map((role) => (
                      <CareerCard
                        key={role}
                        title={role}
                        selected={careerGoal === role}
                        onClick={() => setCareerGoal(role)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building className="w-5 h-5 text-indigo-500" /> Target Companies
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Choose companies you aspire to join. This helps us customize mock interview questionnaires.
                    </p>
                  </div>

                  <CompanyChipSelector
                    selectedCompanies={targetCompanies}
                    onChange={setTargetCompanies}
                  />
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-indigo-500" /> Self Assessment
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Rate your expertise level to help the AI tailor placement roadmaps to your strength.
                    </p>
                  </div>

                  <SkillRating skills={skillsRating} onChange={setSkillsRating} />
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Review & Complete
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Make sure all details are accurate before finishing setup. You can edit any section.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <ReviewCard title="Basic Info" onEdit={() => setCurrentStep(1)}>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Full Name</p>
                        <p className="text-gray-900 dark:text-white font-medium">{basicInfo.fullName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">College</p>
                        <p className="text-gray-900 dark:text-white font-medium">{basicInfo.college}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 col-span-2">
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Degree & Branch</p>
                          <p className="text-gray-900 dark:text-white font-medium text-xs">
                            {basicInfo.degree} - {basicInfo.branch}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Year</p>
                          <p className="text-gray-900 dark:text-white font-medium">Year {basicInfo.year}</p>
                        </div>
                      </div>
                    </ReviewCard>

                    {/* Career Goal */}
                    <ReviewCard title="Career Goal" onEdit={() => setCurrentStep(2)}>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Target Placement Role</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{careerGoal}</p>
                      </div>
                    </ReviewCard>

                    {/* Companies */}
                    <ReviewCard title="Target Companies" onEdit={() => setCurrentStep(3)}>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {targetCompanies.map((company) => (
                          <span
                            key={company}
                            className="px-2 py-1 text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100/50 dark:border-indigo-500/10"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </ReviewCard>

                    {/* Self Assessment */}
                    <ReviewCard title="Self Assessment" onEdit={() => setCurrentStep(4)}>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(skillsRating).map(([skillName, rating]) => (
                          <div key={skillName} className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                            <span className="text-gray-500 dark:text-gray-400 block truncate">{skillName}</span>
                            <span className="font-bold text-gray-900 dark:text-white mt-1 block">
                              {rating} / 5 Stars
                            </span>
                          </div>
                        ))}
                      </div>
                    </ReviewCard>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-6 mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="btn-secondary flex items-center gap-1 text-sm py-2 px-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex items-center gap-1 text-sm py-2 px-5"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20 hover:shadow-emerald-500/35"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Finish Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
