import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  X,
  IndianRupee,
  Wallet,
  Clock,
  ArrowDownToLine,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Percent,
  Info,
  ChevronDown,
  UploadCloud,
  Check,
  User,
  Shield,
} from 'lucide-react';
import { useEarningsStore } from '../../store/earningsStore';

export type StatCategory = 'total' | 'available' | 'pending' | 'withdrawn';

interface EarningsAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: StatCategory;
  onOpenWithdraw?: () => void;
}

export default function EarningsAnalyticsModal({
  isOpen,
  onClose,
  initialCategory = 'total',
  onOpenWithdraw,
}: EarningsAnalyticsModalProps) {
  const { wallet, transactions, chartData } = useEarningsStore();
  const [timeFilter, setTimeFilter] = useState('This month');
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);
  const [chartView, setChartView] = useState('Monthly');
  const [chartViewOpen, setChartViewOpen] = useState(false);

  const totalEarnedPaise = wallet?.totalEarned || 0;
  const availablePaise = wallet?.availableBalance || 0;
  const pendingPaise = wallet?.pendingBalance || 0;
  const withdrawnPaise = wallet?.withdrawnAmount || 0;

  const formatRupees = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxChartValue = Math.max(...(chartData.length > 0 ? chartData.map((d) => d.amount) : [100]));
  const hasChartData = chartData.some((d) => d.amount > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content - Pixel Perfect to User's UI Screenshot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto bg-[#0c0c0c] text-white rounded-[28px] border border-[#202020] shadow-2xl p-6 sm:p-8 z-10 custom-scrollbar space-y-6"
          >
            {/* Top Close Button (Floating) */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10 sm:pr-12">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Payout analytics</h1>
                <p className="text-sm text-gray-400 mt-1">Track revenue, payouts and key metrics in real time.</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Time Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTimeFilterOpen(!timeFilterOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151515] hover:bg-[#1d1d1d] border border-[#292929] text-xs font-medium text-gray-300 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{timeFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
                  </button>

                  {timeFilterOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-[#151515] border border-[#292929] rounded-xl shadow-xl py-1 z-30">
                      {['This month', 'Last 3 months', 'Last 6 months', 'All time'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setTimeFilter(tf);
                            setTimeFilterOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors ${
                            timeFilter === tf ? 'text-indigo-400 font-semibold bg-indigo-500/10' : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Withdraw funds button */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenWithdraw) onOpenWithdraw();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#222222] to-[#2d2d2d] hover:from-[#2c2c2c] hover:to-[#3a3a3a] border border-[#3c3c3c] text-xs font-semibold text-indigo-200 transition-all active:scale-[0.98] shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Withdraw funds</span>
                </button>
              </div>
            </div>

            {/* 2. Top Stats Row (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total earned */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4 flex items-center justify-between hover:border-indigo-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1b1b1b] border border-[#2d2d2d] flex items-center justify-center text-indigo-400">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Total earned</div>
                    <div className="text-xl font-bold text-white mt-0.5">{formatRupees(totalEarnedPaise)}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">— 0% vs last month</div>
                  </div>
                </div>
                {/* Mini Sparkline SVG */}
                <div className="w-16 h-8 flex items-end">
                  <svg viewBox="0 0 64 24" className="w-full h-full stroke-indigo-400 fill-none">
                    <path
                      d="M 2 18 Q 16 20 24 16 T 40 14 T 52 8 T 62 10"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 2: Available */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2d2d2d] flex items-center justify-center text-emerald-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Available</div>
                    <div className="text-xl font-bold text-white mt-0.5">{formatRupees(availablePaise)}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">— 0% vs last month</div>
                  </div>
                </div>
                {/* Mini Sparkline SVG */}
                <div className="w-16 h-8 flex items-end">
                  <svg viewBox="0 0 64 24" className="w-full h-full stroke-emerald-400 fill-none">
                    <path
                      d="M 2 20 Q 14 18 28 19 T 44 14 T 54 10 T 62 8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 3: Pending release */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#231d13] border border-[#3b301a] flex items-center justify-center text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Pending release</div>
                    <div className="text-xl font-bold text-white mt-0.5">{formatRupees(pendingPaise)}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">— 0% vs last month</div>
                  </div>
                </div>
                {/* Mini Sparkline SVG */}
                <div className="w-16 h-8 flex items-end">
                  <svg viewBox="0 0 64 24" className="w-full h-full stroke-amber-400 fill-none">
                    <path
                      d="M 2 18 Q 14 19 26 18 T 42 16 T 52 14 T 62 17"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 4: Withdrawn */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4 flex items-center justify-between hover:border-purple-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1b1b1b] border border-[#2e2e2e] flex items-center justify-center text-purple-400">
                    <ArrowDownToLine className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Withdrawn</div>
                    <div className="text-xl font-bold text-white mt-0.5">{formatRupees(withdrawnPaise)}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">— 0% vs last month</div>
                  </div>
                </div>
                {/* Mini Sparkline SVG */}
                <div className="w-16 h-8 flex items-end">
                  <svg viewBox="0 0 64 24" className="w-full h-full stroke-purple-400 fill-none">
                    <path
                      d="M 2 19 Q 16 18 28 17 T 44 14 T 54 11 T 62 14"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 3. Middle Row (2 Columns: Earnings overview & Revenue split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Earnings overview Line/Area chart */}
              <div className="lg:col-span-7 bg-[#111111] border border-[#232323] rounded-3xl p-6 flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#1d1d1d] flex items-center justify-center text-indigo-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-white">Earnings overview</h3>
                  </div>

                  {/* Monthly Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setChartViewOpen(!chartViewOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171717] hover:bg-[#1e1e1e] border border-[#2a2a2a] text-xs font-medium text-gray-300"
                    >
                      <span>{chartView}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>

                    {chartViewOpen && (
                      <div className="absolute right-0 mt-1 w-28 bg-[#171717] border border-[#2a2a2a] rounded-xl shadow-lg py-1 z-30">
                        {['Monthly', 'Weekly', 'Daily'].map((cv) => (
                          <button
                            key={cv}
                            onClick={() => {
                              setChartView(cv);
                              setChartViewOpen(false);
                            }}
                            className="w-full text-left px-3 py-1 text-xs text-gray-300 hover:bg-white/5"
                          >
                            {cv}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Legend */}
                <div className="flex items-center gap-4 text-xs mb-3 text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Earnings</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 border-t border-dashed border-indigo-300" />
                    <span>Payouts</span>
                  </div>
                </div>

                {/* Chart Area with Y-axis & X-axis */}
                <div className="relative w-full h-44 flex flex-col justify-between pt-2">
                  {/* Y-axis grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-500">
                    {['100', '75', '50', '25', '0'].map((tick) => (
                      <div key={tick} className="flex items-center gap-3 w-full">
                        <span className="w-6 text-right font-mono">{tick}</span>
                        <div className="flex-1 border-b border-[#1e1e1e]" />
                      </div>
                    ))}
                  </div>

                  {/* Empty State or Bars/Curve */}
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                    {!hasChartData ? (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full border border-gray-700/60 bg-[#161616] flex items-center justify-center mb-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-sm font-semibold text-white">No data to display</div>
                        <div className="text-xs text-gray-500 mt-0.5">No earnings or payouts recorded for this period.</div>
                      </div>
                    ) : (
                      <div className="w-full h-32 flex items-end justify-between pl-8 pr-2">
                        {chartData.map((d) => (
                          <div key={d.month} className="flex flex-col items-center gap-1 flex-1 group">
                            <div className="w-full max-w-[20px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md opacity-80 group-hover:opacity-100 transition-all"
                                 style={{ height: `${Math.max((d.amount / maxChartValue) * 100, 8)}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* X-axis months */}
                  <div className="relative z-10 flex justify-between pl-8 pr-1 text-[10px] text-gray-500 font-medium">
                    {months.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Revenue split Donut Chart */}
              <div className="lg:col-span-5 bg-[#111111] border border-[#232323] rounded-3xl p-6 flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1b1b1b] flex items-center justify-center text-purple-400">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Revenue split</h3>
                    <p className="text-xs text-gray-400">How your revenue is distributed</p>
                  </div>
                </div>

                {/* Donut & Legend Content */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto py-2">
                  {/* Donut SVG */}
                  <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      {/* 70% Slice (Blue) */}
                      <circle
                        cx="100"
                        cy="100"
                        r="70"
                        fill="none"
                        stroke="#c9303a"
                        strokeWidth="24"
                        strokeDasharray="439.8"
                        strokeDashoffset="131.9" // 70% of 439.8
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {/* 30% Slice (Purple/Magenta) */}
                      <circle
                        cx="100"
                        cy="100"
                        r="70"
                        fill="none"
                        stroke="#a6a69f"
                        strokeWidth="24"
                        strokeDasharray="439.8"
                        strokeDashoffset="307.8" // 30%
                        transform="rotate(252 100 100)"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-2xl font-extrabold text-white tracking-tight">70%</span>
                      <span className="text-[10px] text-gray-400 font-medium">Mentor share</span>
                    </div>
                  </div>

                  {/* Legend Items */}
                  <div className="flex-1 space-y-4 w-full">
                    {/* Mentor 70% */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Mentor</div>
                          <div className="text-[11px] text-gray-400">Direct to your wallet</div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white">70%</span>
                    </div>

                    {/* Platform 30% */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Platform</div>
                          <div className="text-[11px] text-gray-400">Platform infrastructure</div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white">30%</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Notice Pill */}
                <div className="mt-3 py-2.5 px-3.5 rounded-xl bg-[#161616] border border-[#252525] flex items-center gap-2 text-xs text-gray-300">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Your earnings are auto-split 70/30 for every session.</span>
                </div>
              </div>
            </div>

            {/* 4. Payout timeline (Horizontal Stepper Card) */}
            <div className="bg-[#111111] border border-[#232323] rounded-3xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1b1b1b] flex items-center justify-center text-purple-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Payout timeline</h3>
                    <p className="text-xs text-gray-400">Track your payout journey</p>
                  </div>
                </div>
              </div>

              {/* Stepper Pipeline */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1b1b1b] border border-[#2e2e2e] flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Session completed</div>
                    <div className="text-[11px] text-gray-400">Logged in ledger</div>
                  </div>
                </div>

                {/* Dashed Connector */}
                <div className="hidden md:block flex-1 border-t border-dashed border-gray-700/60 mx-3" />

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a] border border-[#2d2d2d] flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Hold period</div>
                    <div className="text-[11px] text-gray-400">7 days security hold</div>
                  </div>
                </div>

                {/* Dashed Connector */}
                <div className="hidden md:block flex-1 border-t border-dashed border-gray-700/60 mx-3" />

                {/* Step 3 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#231d13] border border-[#3b301a] flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Pending release</div>
                    <div className="text-[11px] text-gray-400">Ready for payout</div>
                  </div>
                </div>

                {/* Dashed Connector */}
                <div className="hidden md:block flex-1 border-t border-dashed border-gray-700/60 mx-3" />

                {/* Step 4 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1b1b1b] border border-[#2e2e2e] flex items-center justify-center text-purple-400 flex-shrink-0">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Payout sent</div>
                    <div className="text-[11px] text-gray-400">To your account</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Bottom Metrics Row (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Mentor revenue */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mentor revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-white">70.0%</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Industry best split rate</div>
                </div>

                {/* Mini Pie visual */}
                <div className="w-10 h-10 relative flex-shrink-0">
                  <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                    <circle r="16" cx="16" cy="16" fill="#8a8a83" />
                    <circle r="8" cx="16" cy="16" fill="none" stroke="#c9303a" strokeWidth="16" strokeDasharray="100" strokeDashoffset="30" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Security hold period */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security hold period</span>
                </div>
                <div className="text-2xl font-bold text-white">7 days</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Automated security hold</div>
              </div>

              {/* Card 3: Minimum payout */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-purple-400" />
                  <span>Minimum payout</span>
                </div>
                <div className="text-2xl font-bold text-white">₹500</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Instant IMPS / UPI transfer</div>
              </div>

              {/* Card 4: Pro tip */}
              <div className="bg-[#111111] border border-[#232323] rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pro tip</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  You earn 70% of every session, automatically split and credited after the security hold period.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
