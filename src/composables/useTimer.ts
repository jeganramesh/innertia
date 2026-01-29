import { ref, onMounted, onUnmounted, watch } from 'vue';

export function useTimer(initialSeconds: number) {
  const remaining = ref(initialSeconds);
  const isActive = ref(false);
  const isExpired = ref(false);
  let interval: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    if (!isActive.value && !isExpired.value) {
      isActive.value = true;
      interval = setInterval(() => {
        if (remaining.value > 0) {
          remaining.value--;
        } else {
          stop();
          isExpired.value = true;
        }
      }, 1000);
    }
  };

  const stop = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    isActive.value = false;
  };

  const reset = (newSeconds: number = initialSeconds) => {
    stop();
    remaining.value = newSeconds;
    isExpired.value = false;
  };

  onMounted(() => {
    // Optionally start timer immediately on mount
    // start();
  });

  onUnmounted(() => {
    stop();
  });

  // Watch initialSeconds prop changes to reset timer
  watch(() => initialSeconds, (newVal) => {
    if (newVal !== remaining.value) {
      reset(newVal);
    }
  });

  return {
    remaining,
    isActive,
    isExpired,
    start,
    stop,
    reset,
  };
}
