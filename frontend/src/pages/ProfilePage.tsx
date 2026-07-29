import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  GraduationCap,
  Briefcase,
  Calendar,
  Edit3,
  Save,
  X,
  Linkedin,
  FileText,
  Upload,
  Trash2,
  Loader2,
  Building,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

// Components
import CompanyChipSelector from '../components/onboarding/CompanyChipSelector';
import SkillRating from '../components/onboarding/SkillRating';
import CareerCard from '../components/onboarding/CareerCard';

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

export default function ProfilePage() {
  const { user, setUser, fetchUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    college: '',
    degree: '',
    branch: '',
    year: 1,
    careerGoal: '',
    targetCompanies: [] as string[],
    selfAssessment: {} as Record<string, number>,
  });

  const [mentorForm, setMentorForm] = useState({
    fullName: '',
    company: '',
    designation: '',
    experience: 0,
    skills: [] as string[],
    linkedin: '',
    bio: '',
  });

  const [mentorSkillInput, setMentorSkillInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/profile');
      setProfile(data.profile);
      
      if (user?.role === 'student' && data.profile) {
        setStudentForm({
          fullName: data.profile.fullName || '',
          college: data.profile.college || '',
          degree: data.profile.degree || '',
          branch: data.profile.branch || '',
          year: data.profile.year || 1,
          careerGoal: data.profile.careerGoal || '',
          targetCompanies: data.profile.targetCompanies || [],
          selfAssessment: data.profile.selfAssessment || {},
        });
      } else if (user?.role === 'mentor' && data.profile) {
        setMentorForm({
          fullName: data.profile.fullName || '',
          company: data.profile.company || '',
          designation: data.profile.designation || '',
          experience: data.profile.experience || 0,
          skills: data.profile.skills || [],
          linkedin: data.profile.linkedin || '',
          bio: data.profile.bio || '',
        });
      }
    } catch (error: any) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Constraints check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP formats are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximum file size allowed is 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const { data } = await api.post('/profile/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update local storage and context state immediately
      if (user) {
        const updatedUser = {
          ...user,
          profileImage: data.profileImage,
        };
        setUser(updatedUser);
      }
      
      toast.success('Profile picture updated successfully!');
      loadProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    setUploading(true);
    try {
      await api.delete('/profile/remove-image');
      if (user) {
        const updatedUser = {
          ...user,
          profileImage: null,
        };
        setUser(updatedUser);
      }
      toast.success('Profile picture removed successfully');
      loadProfile();
    } catch (error: any) {
      toast.error('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const addMentorSkill = () => {
    const skill = mentorSkillInput.trim();
    if (skill && !mentorForm.skills.includes(skill)) {
      setMentorForm({
        ...mentorForm,
        skills: [...mentorForm.skills, skill],
      });
      setMentorSkillInput('');
    }
  };

  const removeMentorSkill = (skill: string) => {
    setMentorForm({
      ...mentorForm,
      skills: mentorForm.skills.filter((s) => s !== skill),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user?.role === 'student') {
        const { fullName, college, degree, branch, year, careerGoal, targetCompanies, selfAssessment } = studentForm;
        if (!fullName.trim() || !college.trim() || !degree.trim() || !branch.trim() || !careerGoal || targetCompanies.length === 0) {
          toast.error('Please fill out all required fields');
          setLoading(false);
          return;
        }

        const { data } = await api.put('/profile', studentForm);
        setProfile(data.profile);
        toast.success('Student profile saved successfully');
      } else if (user?.role === 'mentor') {
        const { fullName, company, designation, experience, skills, linkedin, bio } = mentorForm;
        if (!fullName.trim() || !company.trim() || !designation.trim() || experience < 0 || skills.length === 0 || !linkedin.trim() || !bio.trim()) {
          toast.error('Please fill out all required fields');
          setLoading(false);
          return;
        }

        const { data } = await api.put('/profile', mentorForm);
        setProfile(data.profile);
        toast.success('Mentor profile saved successfully');
      }
      
      await fetchUser(); // Reload user store variables
      setEditMode(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-48 bg-gray-250 dark:bg-gray-800 rounded-3xl" />
        <div className="h-64 bg-gray-250 dark:bg-gray-800 rounded-3xl" />
      </div>
    );
  }

  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 px-4 sm:px-6">
      
      {/* Profile Header Block */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden rounded-3xl shadow-xl relative p-6 sm:p-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-indigo-500/20 shadow-lg relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              ) : user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={profile?.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Overlays / Click helpers */}
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <button
                type="button"
                onClick={handleImageUploadClick}
                disabled={uploading}
                title="Upload Photo"
                className="w-8 h-8 rounded-full bg-indigo-650 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-all border border-white dark:border-gray-900 bg-indigo-600"
              >
                <Upload className="w-4 h-4" />
              </button>
              {user?.profileImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  title="Remove Photo"
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-all border border-white dark:border-gray-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Details */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {profile?.fullName}
            </h1>
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm capitalize flex items-center justify-center md:justify-start gap-1.5">
              <Award className="w-4 h-4" /> {user?.role} Path
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {user?.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Member since {formattedDate}
              </span>
            </div>
          </div>

          {/* Edit Switch */}
          <div className="pt-2 md:pt-0">
            {!editMode ? (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="btn-secondary flex items-center gap-1.5 py-2 px-4 text-sm"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Form/Details Display */}
      <AnimatePresence mode="wait">
        {!editMode ? (
          <motion.div
            key="displayMode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {user?.role === 'student' ? (
              /* STUDENT DISPLAY VIEW */
              <div className="grid md:grid-cols-3 gap-6">
                {/* Academic Profile */}
                <div className="glass-card p-6 md:col-span-2 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">
                    Academic profile
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">University / College</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-200">{profile?.college}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Degree Program</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-200">{profile?.degree}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Branch / Specialization</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-200">{profile?.branch}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Current Academic Year</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-200">Year {profile?.year}</span>
                    </div>
                  </div>
                </div>

                {/* Target Role & Companies */}
                <div className="glass-card p-6 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">
                    Target Role
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Career Path Goal</span>
                      <span className="text-indigo-650 dark:text-indigo-400 font-bold block">{profile?.careerGoal}</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Target Companies</span>
                      <div className="flex flex-wrap gap-1.5">
                        {profile?.targetCompanies?.map((comp: string) => (
                          <span
                            key={comp}
                            className="text-xs px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Self Assessment */}
                <div className="glass-card p-6 md:col-span-3 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">
                    Proficiency Self Assessment
                  </h2>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {profile?.selfAssessment &&
                      Object.entries(profile.selfAssessment).map(([skill, val]: [string, any]) => (
                        <div key={skill} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 block truncate">{skill}</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < val ? 'bg-amber-400' : 'bg-gray-250 dark:bg-gray-800'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
                              {val}/5
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              /* MENTOR DISPLAY VIEW */
              <div className="grid md:grid-cols-3 gap-6">
                {/* Professional Info */}
                <div className="glass-card p-6 md:col-span-2 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">
                    Professional Experience
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Current Employer</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-200">{profile?.company}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Role Title</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-200">{profile?.designation}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">Years of Experience</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-200">{profile?.experience} Years</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 dark:text-gray-500 block text-xs">LinkedIn Handle</span>
                      <a
                        href={profile?.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Linkedin className="w-4 h-4" /> Link
                      </a>
                    </div>
                  </div>
                </div>

                {/* Primary Skills */}
                <div className="glass-card p-6 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">
                    Expertise Skills
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.skills?.map((skill: string) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-semibold border border-indigo-100/50 dark:border-indigo-900/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Biography */}
                <div className="glass-card p-6 md:col-span-3 space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2 flex items-center gap-1.5">
                    <FileText className="w-5 h-5 text-indigo-500" /> Biography
                  </h2>
                  <p className="text-sm text-gray-655 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {profile?.bio}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* EDIT MODE FORM */
          <motion.div
            key="editMode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <form onSubmit={handleSave} className="glass-card p-6 sm:p-8 space-y-6">
              
              {user?.role === 'student' ? (
                /* STUDENT EDIT FORM */
                <div className="space-y-6">
                  <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Academic & Target Profile</h2>
                    <p className="text-xs text-gray-500 mt-1">Provide updated information for your student account.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={studentForm.fullName}
                        onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        College / University *
                      </label>
                      <input
                        type="text"
                        value={studentForm.college}
                        onChange={(e) => setStudentForm({ ...studentForm, college: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Degree *
                      </label>
                      <input
                        type="text"
                        value={studentForm.degree}
                        onChange={(e) => setStudentForm({ ...studentForm, degree: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Branch *
                      </label>
                      <input
                        type="text"
                        value={studentForm.branch}
                        onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Current Year *
                      </label>
                      <select
                        value={studentForm.year}
                        onChange={(e) => setStudentForm({ ...studentForm, year: Number(e.target.value) })}
                        className="input-field cursor-pointer"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                        <option value={5}>5th Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Career Goal */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Career Goal Role *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {CAREER_GOALS.map((role) => (
                        <CareerCard
                          key={role}
                          title={role}
                          selected={studentForm.careerGoal === role}
                          onClick={() => setStudentForm({ ...studentForm, careerGoal: role })}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Target Companies */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Target Companies *
                    </label>
                    <CompanyChipSelector
                      selectedCompanies={studentForm.targetCompanies}
                      onChange={(comps) => setStudentForm({ ...studentForm, targetCompanies: comps })}
                    />
                  </div>

                  {/* Skill ratings */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Skill Proficiency Ratings *
                    </label>
                    <SkillRating
                      skills={studentForm.selfAssessment}
                      onChange={(skillsVal) => setStudentForm({ ...studentForm, selfAssessment: skillsVal })}
                    />
                  </div>
                </div>
              ) : (
                /* MENTOR EDIT FORM */
                <div className="space-y-6">
                  <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Professional Profile</h2>
                    <p className="text-xs text-gray-500 mt-1">Provide updated details for your mentor card.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={mentorForm.fullName}
                        onChange={(e) => setMentorForm({ ...mentorForm, fullName: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Company Employer *
                      </label>
                      <input
                        type="text"
                        value={mentorForm.company}
                        onChange={(e) => setMentorForm({ ...mentorForm, company: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Designation Role *
                      </label>
                      <input
                        type="text"
                        value={mentorForm.designation}
                        onChange={(e) => setMentorForm({ ...mentorForm, designation: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Years of Experience *
                      </label>
                      <input
                        type="number"
                        value={mentorForm.experience === 0 ? '' : mentorForm.experience}
                        onChange={(e) => setMentorForm({ ...mentorForm, experience: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        LinkedIn URL Profile *
                      </label>
                      <input
                        type="url"
                        value={mentorForm.linkedin}
                        onChange={(e) => setMentorForm({ ...mentorForm, linkedin: e.target.value })}
                        className="input-field"
                        placeholder="https://linkedin.com/in/username"
                        required
                      />
                    </div>
                  </div>

                  {/* Skills tags list */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Expertise Skills *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mentorSkillInput}
                        onChange={(e) => setMentorSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addMentorSkill();
                          }
                        }}
                        className="input-field flex-1"
                        placeholder="Type skill name and press Enter..."
                      />
                      <button
                        type="button"
                        onClick={addMentorSkill}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 bg-gray-50 dark:bg-gray-800/10 rounded-xl border border-gray-150 dark:border-gray-800">
                      {mentorForm.skills.length === 0 ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500 self-center">
                          No skills added. Add skills.
                        </span>
                      ) : (
                        mentorForm.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeMentorSkill(skill)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bio Description *
                    </label>
                    <textarea
                      value={mentorForm.bio}
                      onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                      className="input-field h-32 resize-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-6">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="btn-secondary py-2 px-5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-6 text-sm flex items-center gap-1"
                >
                  <Save className="w-4 h-4" /> Save Details
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
