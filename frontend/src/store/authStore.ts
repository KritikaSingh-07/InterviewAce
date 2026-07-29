import { create } from 'zustand';
import api from '../lib/api';
import { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const token = localStorage.getItem('token');
  let user: User | null = null;
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) user = JSON.parse(savedUser);
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
  }

  return {
    user,
    token,
    isLoading: false,
    isAuthenticated: !!token,

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        set({ token: data.token, isAuthenticated: true, user: data.user as unknown as User });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Login failed');
      } finally {
        set({ isLoading: false });
      }
    },

    register: async (email: string, password: string, fullName: string) => {
      set({ isLoading: true });
      try {
        const { data } = await api.post<AuthResponse>('/auth/register', {
          email,
          password,
          fullName,
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        set({ token: data.token, isAuthenticated: true, user: data.user as unknown as User });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Registration failed');
      } finally {
        set({ isLoading: false });
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
      window.location.href = '/';
    },

    fetchUser: async () => {
      try {
        const { data } = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(data.user));
        set({ user: data.user, isAuthenticated: true });
      } catch {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },

    setUser: (user: User) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    },
  };
});

