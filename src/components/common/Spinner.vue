<template>
  <div :class="sizeClasses" role="status">
    <svg
      :class="['animate-spin', colorClasses]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span v-if="showText" class="sr-only">Loading...</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  showText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  showText: false,
});

const sizeClasses = computed(() => {
  const classes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  return classes[props.size];
});

const colorClasses = computed(() => {
  const classes = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    white: 'text-white',
    gray: 'text-gray-600',
  };
  return classes[props.color];
});
</script>