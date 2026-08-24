import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Sparkles,
  Crown,
  Filter,
  Layers,
  Award,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { MentorStudent } from '../../types';
import StudentList from '../../components/mentor/StudentList';
import StudentDetailModal from '../../components/mentor/StudentDetailModal';
import MentorScheduleModal from '../../components/mentor/MentorScheduleModal';

type PlanFilter = 'all' | 'pro' | 'agency';

export default function MentorStudents() {
  const [students, setStudents] = useState<MentorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<MentorStudent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<MentorStudent | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const fetchStudents = async (planType?: string) => {
    setLoading(true);
    try {
      // Query parameters for plan filtering: pro, agency, or both
      const queryParam = planType && planType !== 'all' ? `?plan_type=${planType}` : '?plan_type=pro,agency';
      const { data } = await api.get(`/mentor/students${queryParam}`);
      setStudents(data.students || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(planFilter);
  }, [planFilter]);

  // Handle on-card student click -> Open detailed modal
  const handleSelectStudent = (student: MentorStudent) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  // Handle schedule action click -> Open schedule modal
  const handleScheduleStudent = (student: MentorStudent) => {
    setScheduleTarget(student);
    setIsScheduleOpen(true);
  };

  // Real-time client search filter
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter((s) => {
      const nameMatch = s.fullName?.toLowerCase().includes(query);
      const emailMatch = s.email?.toLowerCase().includes(query);
      const roleMatch = s.careerGoal?.toLowerCase().includes(query);
      const collegeMatch = s.college?.toLowerCase().includes(query);
      const branchMatch = s.branch?.toLowerCase().includes(query);
      const companyMatch = s.targetCompanies?.some((c) => c.toLowerCase().includes(query));
      const planMatch = (s.plan === 'agency' ? 'agency' : 'model pro').includes(query);

      return nameMatch || emailMatch || roleMatch || collegeMatch || branchMatch || companyMatch || planMatch;
    });
  }, [students, search]);

  // Compute tier metrics
  const totalCount = students.length;
  const proCount = students.filter((s) => s.plan === 'pro').length;
  const agencyCount = students.filter((s) => s.plan === 'agency').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Pro & Agency Students
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                  Mentor Exclusives
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Candidate directory strictly restricted to <span className="font-semibold text-violet-600 dark:text-violet-400">Model Pro</span> and <span className="font-semibold text-amber-600 dark:text-amber-400">Agency</span> subscribers.
              </p>
            </div>
          </div>

          {/* Search bar & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, company, role..."
                className="input-field pl-10 !py-2.5 text-sm w-full"
              />
            </div>
            <button
              onClick={() => fetchStudents(planFilter)}
              title="Refresh students"
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-800/80 text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tier Filter Tabs & Counts */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50">
            <button
              type="button"
              onClick={() => setPlanFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                planFilter === 'all'
                  ? 'bg-white dark:bg-gray-900 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Tiers ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('pro')}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                planFilter === 'pro'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Model Pro ({proCount})
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('agency')}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                planFilter === 'agency'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <Crown className="w-3 h-3" />
              Agency ({agencyCount})
            </button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-900 dark:text-white">{filteredStudents.length}</span> eligible candidates
          </div>
        </div>
      </motion.div>

      {/* Main Student Directory Grid */}
      <StudentList
        students={filteredStudents}
        loading={loading}
        searchQuery={search}
        selectedPlanFilter={planFilter}
        onSelectStudent={handleSelectStudent}
        onScheduleStudent={handleScheduleStudent}
        onClearFilters={() => {
          setSearch('');
          setPlanFilter('all');
        }}
      />

      {/* Interactive Detail Modal / Drawer */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedStudent(null);
        }}
        onScheduleInterview={(student) => {
          setIsDetailOpen(false);
          handleScheduleStudent(student);
        }}
      />

      {/* Schedule Interview Modal */}
      <MentorScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setScheduleTarget(null);
        }}
        students={students}
        selectedStudent={scheduleTarget}
        onScheduled={() => {
          fetchStudents(planFilter);
        }}
      />
    </div>
  );
}
