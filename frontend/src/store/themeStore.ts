import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggle: () => void;
  setDarkMode: (val: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: localStorage.getItem('theme') === 'dark',
  toggle: () =>
    set((state) => {
      const newVal = !state.isDarkMode;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      if (newVal) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode: newVal };
    }),
  setDarkMode: (val: boolean) => {
    localStorage.setItem('theme', val ? 'dark' : 'light');
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDarkMode: val });
  },
}));

