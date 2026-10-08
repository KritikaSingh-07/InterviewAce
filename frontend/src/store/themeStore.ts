import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggle: () => void;
  setDarkMode: (val: boolean) => void;
}

// Applies the theme class and briefly enables colour transitions so the
// light/dark switch fades instead of snapping.
function applyTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  root.classList.toggle('dark', dark);
  window.setTimeout(() => root.classList.remove('theme-transition'), 450);
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: localStorage.getItem('theme') === 'dark',
  toggle: () =>
    set((state) => {
      const newVal = !state.isDarkMode;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      applyTheme(newVal);
      return { isDarkMode: newVal };
    }),
  setDarkMode: (val: boolean) => {
    localStorage.setItem('theme', val ? 'dark' : 'light');
    applyTheme(val);
    set({ isDarkMode: val });
  },
}));
