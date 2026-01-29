import { ref, watch, onMounted } from 'vue';

export const useTheme = () => {
  const theme = ref<'light' | 'dark' | 'system'>('light');
  const isDark = ref(false);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    if (theme.value === 'system') {
      setTheme('dark');
    } else if (theme.value === 'dark') {
      setTheme('light');
    } else {
      setTheme('system');
    }
  };

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    if (selectedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      isDark.value = prefersDark;
    } else {
      document.documentElement.classList.toggle('dark', selectedTheme === 'dark');
      isDark.value = selectedTheme === 'dark';
    }
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      theme.value = savedTheme;
    }
    applyTheme(theme.value);

    // Watch system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme.value === 'system') {
        applyTheme('system');
      }
    });
  };

  onMounted(initTheme);

  watch(theme, (newTheme) => {
    applyTheme(newTheme);
  });

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
};