<template>
  <div class="w-full bg-gray-200 rounded-full h-2.5">
    <div
      class="h-2.5 rounded-full transition-all duration-500 ease-out"
      :class="progressColorClass"
      :style="{ width: `${percentage}%` }"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps } from 'vue';

type ProgressBarColor = 'primary' | 'success' | 'warning' | 'error';

const props = withDefaults(defineProps<{
  percentage: number;
  color?: ProgressBarColor;
}>(), {
  percentage: 0,
  color: 'primary',
});

const progressColorClass = computed(() => {
  switch (props.color) {
    case 'primary':
      return 'bg-primary';
    case 'success':
      return 'bg-success';
    case 'warning':
      return 'bg-warning';
    case 'error':
      return 'bg-error';
    default:
      return 'bg-primary';
  }
});
</script>