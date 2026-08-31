import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { IndianRupee, Wallet, Clock, ArrowDownToLine, ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEarningsStore } from '../../store/earningsStore';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { wallet, bankAccount, requestWithdrawal } = useEarningsStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const availableBalance = wallet?.availableBalance ? wallet.availableBalance / 100 : 0;

  const handleContinue = () => {
    const val = Number(amount);
    if (!val || val < 500) {
      toast.error('Minimum withdrawal amount is ₹500');
      return;
    }
    if (val > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }
    if (!bankAccount) {
      toast.error('Please add a bank account first in Bank Settings');
      return;
    }
    setStep(2);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Convert to paise for API
      await requestWithdrawal(Number(amount) * 100);
      setStep(3);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setAmount('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
        >
          {step === 1 && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Available: ₹{availableBalance.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount to Withdraw (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="500"
                      className="input-field pl-8 !text-lg"
                      min="500"
                      max={availableBalance}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Minimum ₹500</span>
                    <button
                      type="button"
                      onClick={() => setAmount(String(availableBalance))}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button onClick={resetAndClose} className="flex-1 btn-secondary py-2.5">Cancel</button>
                  <button onClick={handleContinue} className="flex-1 btn-primary py-2.5">Continue</button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Withdrawal</h3>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">₹{Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Transfer to</span>
                  <div className="text-right">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">{bankAccount?.bankName}</span>
                    <span className="block text-xs text-gray-500">{bankAccount?.accountNumberMasked}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Est. Arrival</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">3-5 business days</span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full btn-primary py-3 bg-gradient-to-r from-emerald-500 to-teal-500 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm Withdrawal <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Withdrawal Request Submitted</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your withdrawal of <span className="font-semibold text-gray-700 dark:text-gray-300">₹{Number(amount).toLocaleString()}</span> is pending admin approval and processing.
              </p>
              <button onClick={resetAndClose} className="w-full btn-secondary py-2.5">
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
