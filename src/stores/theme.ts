import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark' | 'system'>('light');
  
  const toggleTheme = () => {
    if (theme.value === 'system') {
      theme.value = 'dark';
    } else if (theme.value === 'dark') {
      theme.value = 'light';
    } else {
      theme.value = 'system';
    }
  };
  
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    theme.value = newTheme;
  };
  
  // Watch for changes and apply to DOM
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  }, { immediate: true });
  
  return {
    theme,
    toggleTheme,
    setTheme,
  };
});