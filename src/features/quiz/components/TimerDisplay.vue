<template>
  <div class="flex items-center space-x-2 text-gray-700">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Time remaining"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    <span :class="{'text-error font-semibold': remainingSeconds <= 30}" class="transition-colors">{{ formattedTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps } from 'vue';

const props = withDefaults(defineProps<{
  remainingSeconds: number;
}>(), {
  remainingSeconds: 0,
});

const formattedTime = computed(() => {
  const minutes = Math.floor(props.remainingSeconds / 60);
  const seconds = props.remainingSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});
</script>