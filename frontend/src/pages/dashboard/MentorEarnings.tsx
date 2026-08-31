import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  IndianRupee,
  Wallet,
  Clock,
  ArrowDownToLine,
  AlertCircle,
  Building2,
  TrendingUp,
  Save,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEarningsStore } from '../../store/earningsStore';
import WithdrawModal from '../../components/earnings/WithdrawModal';
import EarningsAnalyticsModal, { StatCategory } from '../../components/earnings/EarningsAnalyticsModal';
import { BankAccountFormData } from '../../types';
import { validateUpiId } from '../../utils/upiValidator';

// Smooth animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
    },
  },
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export default function MentorEarnings() {
  const {
    wallet,
    transactions,
    chartData,
    loading,
    fetchDashboard,
    fetchTransactions,
    fetchChart,
    bankAccount,
    fetchBankAccount,
    saveBankAccount,
    verifyBankAccount,
    deleteBankAccount,
  } = useEarningsStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'bank'>('overview');
  const [filterType, setFilterType] = useState('all');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StatCategory>('total');

  // Bank Form State
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [formData, setFormData] = useState<BankAccountFormData>({
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    accountHolderName: '',
    payoutMethod: 'bank_transfer',
  });
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchTransactions();
    fetchChart();
    fetchBankAccount();
  }, []);

  useEffect(() => {
    fetchTransactions({ type: filterType === 'all' ? undefined : filterType });
  }, [filterType]);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.payoutMethod === 'bank_transfer') {
      if (formData.accountNumber !== formData.confirmAccountNumber) {
        toast.error('Account numbers do not match');
        return;
      }
      if (formData.ifsc.length !== 11) {
        toast.error('IFSC code must be 11 characters');
        return;
      }
    } else if (formData.payoutMethod === 'upi') {
      const upiVal = validateUpiId(formData.upiId || '');
      if (!upiVal.isValid) {
        toast.error(upiVal.errorMessage || 'Invalid UPI ID format (e.g. name@paytm, 9876543210@ybl)');
        return;
      }
    }
    setBankLoading(true);
    try {
      await saveBankAccount(formData);
      toast.success('Bank account details saved');
      setIsEditingBank(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save bank details');
    } finally {
      setBankLoading(false);
    }
  };

  const handleVerifyBank = async () => {
    setBankLoading(true);
    try {
      await verifyBankAccount();
      toast.success('Penny drop verification initiated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setBankLoading(false);
    }
  };

  const handleDeleteBank = async () => {
    if (window.confirm('Are you sure you want to remove your bank account?')) {
      setBankLoading(true);
      try {
        await deleteBankAccount();
        toast.success('Bank account removed');
        setIsEditingBank(true);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to remove bank account');
      } finally {
        setBankLoading(false);
      }
    }
  };

  const statCards = [
    {
      category: 'total' as StatCategory,
      label: 'Total Earned',
      value: wallet?.formatted.totalEarned ? `₹${wallet.formatted.totalEarned}` : '₹0',
      icon: IndianRupee,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      hint: 'Gross vs 70% Cut',
    },
    {
      category: 'available' as StatCategory,
      label: 'Available Balance',
      value: wallet?.formatted.availableBalance ? `₹${wallet.formatted.availableBalance}` : '₹0',
      icon: Wallet,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      hint: 'Ready for Payout',
    },
    {
      category: 'pending' as StatCategory,
      label: 'Pending Approval',
      value: wallet?.formatted.pendingBalance ? `₹${wallet.formatted.pendingBalance}` : '₹0',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      hint: '7-Day Hold Timeline',
    },
    {
      category: 'withdrawn' as StatCategory,
      label: 'Withdrawn',
      value: wallet?.formatted.withdrawnAmount ? `₹${wallet.formatted.withdrawnAmount}` : '₹0',
      icon: ArrowDownToLine,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      hint: 'Disbursement Stats',
    },
  ];

  const maxChartValue = Math.max(...(chartData.length > 0 ? chartData.map((d) => d.amount) : [100]));

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settled':
        return <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">Settled</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">Pending</span>;
      case 'withdrawn':
        return <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium">Withdrawn</span>;
      case 'reversed':
        return <span className="px-2 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">Reversed</span>;
      default:
        return <span className="px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">{status}</span>;
    }
  };

  const renderVerificationStatus = () => {
    if (!bankAccount) return null;
    switch (bankAccount.verificationStatus) {
      case 'verified':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-xs font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs font-semibold">Unverified</span>;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings & Payouts</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage mock interview earnings, bank details & withdrawal requests.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!bankAccount) {
                  toast.error('Please configure your bank account details first');
                  setActiveTab('bank');
                } else {
                  setIsWithdrawOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Withdraw Funds
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-8 border-b border-gray-100 dark:border-gray-800/80 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Overview & Transactions
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${
              activeTab === 'bank'
                ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Bank & Payout Details
            {!bankAccount && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {!bankAccount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-200"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">You need to configure bank details before requesting payouts.</p>
            <button
              onClick={() => setActiveTab('bank')}
              className="ml-auto text-sm font-semibold underline hover:no-underline text-amber-900 dark:text-amber-100"
            >
              Add Bank Account
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Tab Switcher Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="tab-overview"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-8"
          >
            {/* Stats Grid - Clickable for Visual Charts & Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ y: -3, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    setSelectedCategory(stat.category);
                    setAnalyticsModalOpen(true);
                  }}
                  className="glass-card p-6 cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                    {stat.hint}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Section */}
              <motion.div variants={itemVariants} className="lg:col-span-1 glass-card p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Overview</h2>
                </div>

                <div className="flex-1 flex items-end justify-between gap-2 h-[130px] pt-4">
                  {chartData.length > 0 ? (
                    chartData.map((d) => (
                      <div key={d.month} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="relative w-full h-[130px] flex items-end justify-center">
                          <div
                            className="w-full max-w-[32px] bg-indigo-500/20 group-hover:bg-indigo-500/40 rounded-t-md transition-all relative overflow-hidden"
                            style={{ height: `${Math.max((d.amount / maxChartValue) * 100, 8)}%` }}
                          >
                            <div className="absolute inset-x-0 bottom-0 bg-indigo-500 rounded-t-md opacity-60" style={{ height: '100%' }} />
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{d.label}</span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full flex items-center justify-center h-full text-sm text-gray-400">No data available</div>
                  )}
                </div>
              </motion.div>

              {/* Transactions Table */}
              <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h2>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {['all', 'session_earning', 'withdrawal', 'refund_debit'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          filterType === type
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                      >
                        {type === 'all' ? 'All' : type === 'session_earning' ? 'Earnings' : type === 'withdrawal' ? 'Withdrawals' : 'Refunds'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <th className="pb-3 pr-4 font-medium">Description</th>
                        <th className="pb-3 pr-4 font-medium">Student</th>
                        <th className="pb-3 pr-4 font-medium">Amount</th>
                        <th className="pb-3 pr-4 font-medium">Date</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map((tx) => (
                          <tr key={tx._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="py-3 pr-4 text-gray-900 dark:text-white font-medium">{tx.description}</td>
                            <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{tx.studentName || '-'}</td>
                            <td className="py-3 pr-4">
                              <span className={`font-semibold ${tx.type === 'withdrawal' || tx.type === 'refund_debit' ? 'text-red-500' : 'text-emerald-500'}`}>
                                {tx.type === 'withdrawal' || tx.type === 'refund_debit' ? '-' : '+'}{formatAmount(tx.mentorShare)}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="py-3">{getStatusBadge(tx.status)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">No transactions found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tab-bank"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6 max-w-4xl"
          >
            {bankAccount && !isEditingBank ? (
              <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                      <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Payout Method</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Encrypted and verified for instant withdrawals</p>
                    </div>
                  </div>
                  {renderVerificationStatus()}
                </div>

                <div className="grid sm:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Account Holder</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">{bankAccount.accountHolderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Bank Name / Provider</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">{bankAccount.bankName || 'Verified Account'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Account / UPI ID</p>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white text-base">{bankAccount.accountNumberMasked}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">IFSC / Routing</p>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white text-base">{bankAccount.ifscDisplay || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  {bankAccount.verificationStatus === 'unverified' && (
                    <button
                      onClick={handleVerifyBank}
                      disabled={bankLoading}
                      className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-500"
                    >
                      {bankLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Verify Penny-Drop
                    </button>
                  )}
                  <button onClick={() => setIsEditingBank(true)} className="btn-secondary py-2.5 px-5 text-sm">
                    Edit Details
                  </button>
                  <button
                    onClick={handleDeleteBank}
                    disabled={bankLoading}
                    className="py-2.5 px-5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Remove Method
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                      <CreditCard className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {bankAccount ? 'Update Payout Details' : 'Add Bank / UPI Details'}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">All data is AES-256 encrypted before storage.</p>
                    </div>
                  </div>
                  {bankAccount && (
                    <button onClick={() => setIsEditingBank(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveBank} className="space-y-6">
                  <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payoutMethod: 'bank_transfer' })}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        formData.payoutMethod === 'bank_transfer'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payoutMethod: 'upi' })}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        formData.payoutMethod === 'upi'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      UPI ID
                    </button>
                  </div>

                  {formData.payoutMethod === 'bank_transfer' ? (
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number *</label>
                        <div className="relative">
                          <input
                            type={showAccount ? 'text' : 'password'}
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="input-field pr-12 font-mono"
                            placeholder="Enter bank account number"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowAccount(!showAccount)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {showAccount ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Account Number *</label>
                        <input
                          type="text"
                          value={formData.confirmAccountNumber}
                          onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value })}
                          className="input-field font-mono"
                          placeholder="Re-enter account number"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IFSC Code *</label>
                        <input
                          type="text"
                          value={formData.ifsc}
                          onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                          className="input-field font-mono uppercase"
                          placeholder="e.g. HDFC0001234"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Holder Name *</label>
                        <input
                          type="text"
                          value={formData.accountHolderName}
                          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                          className="input-field"
                          placeholder="Name as per bank records"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            UPI ID (VPA) *
                          </label>
                          {formData.upiId && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                validateUpiId(formData.upiId).isValid
                                  ? validateUpiId(formData.upiId).color
                                  : 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800'
                              }`}
                            >
                              {validateUpiId(formData.upiId).isValid
                                ? `✓ ${validateUpiId(formData.upiId).providerName}`
                                : 'Invalid Format'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={formData.upiId || ''}
                          onChange={(e) => setFormData({ ...formData, upiId: e.target.value.toLowerCase().trim() })}
                          className={`input-field font-mono ${
                            formData.upiId
                              ? validateUpiId(formData.upiId).isValid
                                ? '!border-emerald-500 focus:!ring-emerald-500'
                                : '!border-red-500 focus:!ring-red-500'
                              : ''
                          }`}
                          placeholder="e.g. name@paytm, 9876543210@ybl, user@okaxis"
                          required
                        />
                        {formData.upiId && !validateUpiId(formData.upiId).isValid && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {validateUpiId(formData.upiId).errorMessage}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          Supported handles: Paytm (@paytm), PhonePe (@ybl, @ibl, @axl), GPay (@okaxis, @okhdfcbank, @okicici, @oksbi), Amazon Pay (@apl), BHIM/SBI (@upi, @sbi).
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Holder Name *</label>
                        <input
                          type="text"
                          value={formData.accountHolderName}
                          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                          className="input-field"
                          placeholder="Name registered with your UPI app"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                    {bankAccount && (
                      <button
                        type="button"
                        onClick={() => setIsEditingBank(false)}
                        className="btn-secondary py-2.5 px-5"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={bankLoading}
                      className="btn-primary py-2.5 px-6 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
                    >
                      {bankLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save & Encrypt Details
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
      
      <EarningsAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        initialCategory={selectedCategory}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
      />
    </motion.div>
  );
}
