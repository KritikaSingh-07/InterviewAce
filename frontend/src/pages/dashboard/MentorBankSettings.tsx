import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Building2, Save, Trash2, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEarningsStore } from '../../store/earningsStore';
import { BankAccountFormData } from '../../types';

export default function MentorBankSettings() {
  const { bankAccount, fetchBankAccount, saveBankAccount, verifyBankAccount, deleteBankAccount } = useEarningsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BankAccountFormData>({
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    accountHolderName: '',
    payoutMethod: 'bank_transfer'
  });
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
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
    }
    setLoading(true);
    try {
      await saveBankAccount(formData);
      toast.success('Bank account details saved');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyBankAccount();
      toast.success('Penny drop verification initiated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove your bank account?')) {
      setLoading(true);
      try {
        await deleteBankAccount();
        toast.success('Bank account removed');
        setIsEditing(true);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to remove bank account');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStatus = () => {
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Account Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your withdrawal methods and payout details.</p>
        </div>
      </motion.div>

      {bankAccount && !isEditing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Payout Method</h2>
            {renderStatus()}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Holder</p>
              <p className="font-semibold text-gray-900 dark:text-white">{bankAccount.accountHolderName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bank Name</p>
              <p className="font-semibold text-gray-900 dark:text-white">{bankAccount.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Number</p>
              <p className="font-mono font-medium text-gray-900 dark:text-white">{bankAccount.accountNumberMasked}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">IFSC Code</p>
              <p className="font-mono font-medium text-gray-900 dark:text-white">{bankAccount.ifscDisplay}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {bankAccount.verificationStatus === 'unverified' && (
              <button onClick={handleVerify} disabled={loading} className="btn-primary py-2 px-4 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Verify Account
              </button>
            )}
            <button onClick={() => setIsEditing(true)} className="btn-secondary py-2 px-4">Edit Details</button>
            <button onClick={handleDelete} disabled={loading} className="py-2 px-4 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors">
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 md:p-8">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{bankAccount ? 'Update Bank Account' : 'Add Bank Account'}</h2>
            {bankAccount && <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
             <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
               <button
                 type="button"
                 onClick={() => setFormData({ ...formData, payoutMethod: 'bank_transfer' })}
                 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${formData.payoutMethod === 'bank_transfer' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
               >
                 Bank Transfer
               </button>
               <button
                 type="button"
                 onClick={() => setFormData({ ...formData, payoutMethod: 'upi' })}
                 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${formData.payoutMethod === 'upi' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
               >
                 UPI
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
                        className="input-field pr-10 font-mono"
                        required
                      />
                      <button type="button" onClick={() => setShowAccount(!showAccount)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-600 hover:underline">
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
                     required
                   />
                 </div>
               </div>
             ) : (
                <div className="max-w-md space-y-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UPI ID *</label>
                     <input
                       type="text"
                       value={formData.upiId || ''}
                       onChange={(e) => setFormData({ ...formData, upiId: e.target.value.toLowerCase() })}
                       className="input-field font-mono"
                       placeholder="name@bank"
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
                     required
                   />
                 </div>
                </div>
             )}

             <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
               <button type="submit" disabled={loading} className="btn-primary py-2.5 px-6 flex items-center gap-2">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Save Details
               </button>
             </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
