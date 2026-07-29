import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Save, X, Plus, User, Briefcase, Linkedin, FileText, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function MentorOnboardingPage() {
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.profile?.fullName || '',
    company: '',
    designation: '',
    experience: 0,
    skills: [] as string[],
    linkedin: '',
    bio: '',
  });

  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const cleaned = skillInput.trim();
    if (cleaned && !formData.skills.includes(cleaned)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, cleaned],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) return toast.error('Full Name is required');
    if (!formData.company.trim()) return toast.error('Company Name is required');
    if (!formData.designation.trim()) return toast.error('Designation is required');
    if (formData.experience < 0) return toast.error('Years of Experience must be positive');
    if (formData.skills.length === 0) return toast.error('Please add at least one primary skill');
    if (!formData.linkedin.trim()) return toast.error('LinkedIn Profile is required');
    if (!formData.linkedin.startsWith('http://') && !formData.linkedin.startsWith('https://')) {
      return toast.error('Please enter a valid LinkedIn URL starting with https://');
    }
    if (!formData.bio.trim()) return toast.error('Bio is required');

    setLoading(true);
    try {
      await api.post('/mentor-profile', formData);
      await fetchUser();
      toast.success('Mentor profile created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete mentor onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            Mentor Setup
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to <span className="gradient-text">InterviewAce</span> Mentorship
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            Share your domain expertise and guide the next generation of engineers. Let's build your mentor card.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6">
            
            {/* Section 1: Professional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Professional Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="input-field pl-10"
                      placeholder="e.g. Sarah Jenkins"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Company *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Microsoft"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    value={formData.experience === 0 ? '' : formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="input-field"
                    placeholder="e.g. 5"
                    min="0"
                    max="50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LinkedIn Profile *
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      className="input-field pl-10 text-xs sm:text-sm"
                      placeholder="https://linkedin.com/in/username"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Skills Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <ChevronRight className="w-5 h-5 text-indigo-500" /> Primary Expertise Skills *
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills you can mentor in (e.g. React, System Design, Java)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="input-field flex-1"
                    placeholder="Type skill and press Add or Enter..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="btn-secondary px-4 py-3 flex items-center gap-1 text-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {/* Skills List */}
                <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-2 bg-gray-50/50 dark:bg-gray-800/10 rounded-xl border border-gray-150 dark:border-gray-800">
                  {formData.skills.length === 0 ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500 self-center px-1">
                      No skills added yet. Add skills to list your competencies.
                    </span>
                  ) : (
                    formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold border border-indigo-100/50 dark:border-indigo-500/10"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Professional Bio */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Bio / Brief Summary *
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tell students about your background, career accomplishments, and guidance focus.
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-field h-32 resize-none"
                  placeholder="e.g. Senior Software Architect at Microsoft with 12+ years experience. Specializes in scalable backend services, cloud systems, and system design interviews."
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Complete Setup & Continue
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>

      </div>
    </div>
  );
}
