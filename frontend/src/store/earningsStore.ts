import { create } from 'zustand';
import api from '../lib/api';
import type { WalletSummary, LedgerEntry, WithdrawalRequest, BankAccountInfo, MonthlyEarning, BankAccountFormData } from '../types';

interface EarningsState {
  wallet: WalletSummary | null;
  transactions: LedgerEntry[];
  withdrawals: WithdrawalRequest[];
  bankAccount: BankAccountInfo | null;
  chartData: MonthlyEarning[];
  loading: boolean;
  transactionsLoading: boolean;
  pagination: { page: number; limit: number; total: number; pages: number };

  fetchDashboard: () => Promise<void>;
  fetchTransactions: (params?: { page?: number; type?: string; status?: string }) => Promise<void>;
  fetchChart: () => Promise<void>;
  fetchWithdrawals: () => Promise<void>;
  fetchBankAccount: () => Promise<void>;
  requestWithdrawal: (amount: number) => Promise<void>;
  saveBankAccount: (data: BankAccountFormData) => Promise<void>;
  verifyBankAccount: () => Promise<void>;
  deleteBankAccount: () => Promise<void>;
}

export const useEarningsStore = create<EarningsState>((set, get) => ({
  wallet: null,
  transactions: [],
  withdrawals: [],
  bankAccount: null,
  chartData: [],
  loading: false,
  transactionsLoading: false,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },

  fetchDashboard: async () => {
    if (!get().wallet) {
      set({ loading: true });
    }
    try {
      const { data } = await api.get('/earnings/dashboard');
      set({ wallet: data.wallet });
    } catch (error) {
      console.error('Failed to fetch earnings dashboard:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async (params) => {
    set({ transactionsLoading: true });
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.type) queryParams.set('type', params.type);
      if (params?.status) queryParams.set('status', params.status);

      const { data } = await api.get(`/earnings/transactions?${queryParams.toString()}`);
      set({ transactions: data.transactions, pagination: data.pagination });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      set({ transactionsLoading: false });
    }
  },

  fetchChart: async () => {
    try {
      const { data } = await api.get('/earnings/chart');
      set({ chartData: data.chartData });
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
  },

  fetchWithdrawals: async () => {
    try {
      const { data } = await api.get('/earnings/withdrawals');
      set({ withdrawals: data.withdrawals });
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    }
  },

  fetchBankAccount: async () => {
    try {
      const { data } = await api.get('/earnings/bank');
      set({ bankAccount: data.bankAccount });
    } catch (error) {
      console.error('Failed to fetch bank account:', error);
    }
  },

  requestWithdrawal: async (amount: number) => {
    const { data } = await api.post('/earnings/withdraw', { amount });
    // Refresh dashboard and withdrawals
    await Promise.all([get().fetchDashboard(), get().fetchWithdrawals()]);
    return data;
  },

  saveBankAccount: async (formData: BankAccountFormData) => {
    const { data } = await api.post('/earnings/bank', formData);
    set({ bankAccount: data.bankAccount });
  },

  verifyBankAccount: async () => {
    const { data } = await api.post('/earnings/bank/verify');
    set({ bankAccount: data.bankAccount });
  },

  deleteBankAccount: async () => {
    await api.delete('/earnings/bank');
    set({ bankAccount: null });
  },
}));
