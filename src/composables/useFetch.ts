import { ref, watch } from 'vue';
import { api } from '@/services/api';

export const useFetch = <T>(url: string | (() => string)) => {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const execute = async () => {
    loading.value = true;
    error.value = null;

    try {
      const targetUrl = typeof url === 'function' ? url() : url;
      data.value = await api.get<T>(targetUrl);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch data';
    } finally {
      loading.value = false;
    }
  };

  // Auto-fetch if URL is reactive
  if (typeof url === 'function') {
    watch(url, execute, { immediate: true });
  } else {
    execute();
  }

  return {
    data,
    loading,
    error,
    execute,
  };
};
