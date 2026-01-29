import { ref, watch, onMounted, onUnmounted } from 'vue';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const value = ref<T>(initialValue);

  // On mount, read value from localStorage
  onMounted(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        value.value = JSON.parse(storedValue) as T;
      }
    } catch (e) {
      console.error(`Error reading localStorage key “${key}”:`, e);
      // Fallback to initialValue if parsing fails
      localStorage.setItem(key, JSON.stringify(initialValue));
    }
  });

  // Watch for changes in the ref and update localStorage
  watch(value, (newValue) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (e) {
      console.error(`Error writing to localStorage key “${key}”:`, e);
    }
  }, { deep: true }); // Use deep watch for objects/arrays

  // Optionally, listen for changes from other tabs/windows
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === key && event.newValue) {
      try {
        value.value = JSON.parse(event.newValue) as T;
      } catch (e) {
        console.error(`Error parsing localStorage change for key “${key}”:`, e);
      }
    }
  };

  onMounted(() => {
    window.addEventListener('storage', handleStorageChange);
  });

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange);
  });

  return value;
}
