// ==================== USER & AUTH ====================
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'student' | 'mentor';
  isProfileComplete: boolean;
  onboardingCompleted: boolean;
  profileImage?: string | null;
  profileImagePublicId?: string | null;
  profile?: Profile | StudentProfile | MentorProfile;
}

export interface StudentProfile {
  _id: string;
  userId: string;
  fullName: string;
  college: string;
  degree: string;
  branch: string;
  year: number;
  careerGoal: string;
  targetCompanies: string[];
  selfAssessment: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorProfile {
  _id: string;
  userId: string;
  fullName: string;
  company: string;
  designation: string;
  experience: number;
  skills: string[];
  linkedin: string;
  bio: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  _id: string;
  user: string;
  fullName: string;
  avatar: string;
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  targetRole: string;
  yearsOfExperience: number;
  skills: Skill[];
  resumeUrl: string;
  preferences: {
    emailNotifications: boolean;
    darkMode: boolean;
  };
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    isProfileComplete: boolean;
  };
}

// ==================== ROADMAP ====================
export interface Roadmap {
  _id: string;
  user: string;
  targetRole: string;
  careerBio: string;
  durationWeeks: number;
  status: 'generating' | 'active' | 'completed' | 'paused' | 'archived';
  skillGapAnalysis: SkillGap[];
  weeklyStructure: Week[];
  progress: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SkillGap {
  skill: string;
  currentLevel: string;
  targetLevel: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resources: string[];
}

export interface Week {
  week: number;
  focus: string;
  days: TaskDay[];
  completed: boolean;
}

export interface TaskDay {
  _id: string;
  day: number;
  title: string;
  description: string;
  topics: string[];
  resources: Resource[];
  practiceQuestions: PracticeQuestion[];
  completed: boolean;
  completedAt?: string;
}

export interface Resource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'documentation' | 'practice' | 'quiz';
}

export interface PracticeQuestion {
  _id: string;
  question: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'system design';
  difficulty: 'easy' | 'medium' | 'hard';
  answered?: boolean;
  userAnswer?: string;
  score?: number;
  aiFeedback?: {
    idealAnswer: string;
    explanation: string;
    keyPoints: string[];
    score: number;
  };
}

// ==================== MOCK INTERVIEW ====================
export interface MockInterview {
  _id: string;
  user: string;
  role: string;
  experience: 'entry' | 'mid' | 'senior' | 'lead';
  type: 'technical' | 'behavioral' | 'mixed' | 'system-design';
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  questions: QuestionResponse[];
  overallFeedback: FeedbackReport;
  totalScore: number;
  aiAnalysisComplete: boolean;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface QuestionResponse {
  _id: string;
  question: string;
  questionType: string;
  userAnswer: string;
  aiFeedback: QuestionFeedback;
  score: number;
  duration: number;
}

export interface QuestionFeedback {
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  communicationScore: number;
  technicalAccuracy: number;
  suggestedAnswer: string;
  improvementTips: string[];
}

export interface FeedbackReport {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  communicationScore: number;
  technicalAccuracy: number;
  confidenceScore: number;
  missingKeywords: string[];
  improvementTips: string[];
  detailedAnalysis: string;
  recommendedResources: Resource[];
}

// ==================== LEADERBOARD ====================
export interface LeaderboardEntry {
  _id: string;
  user: {
    _id: string;
    email: string;
    profile?: {
      fullName: string;
      avatar: string;
    };
  };
  totalPoints: number;
  weeklyPoints: number;
  rank: number;
  weeklyRank: number;
  badges: Badge[];
  streak: {
    current: number;
    longest: number;
  };
  stats: {
    interviewsCompleted: number;
    roadmapsCompleted: number;
    tasksCompleted: number;
    averageScore: number;
  };
}

export interface Badge {
  name: string;
  icon: string;
  description: string;
  awardedAt: string;
}

// ==================== AI FORMS ====================
export interface RoadmapFormData {
  targetRole: string;
  careerBio: string;
  skills: string[];
  duration: number;
  resume?: File;
}

export interface InterviewFormData {
  role: string;
  experience: 'entry' | 'mid' | 'senior' | 'lead';
  type: 'technical' | 'behavioral' | 'mixed' | 'system-design';
  duration: number;
}

// ==================== API TYPES ====================
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

