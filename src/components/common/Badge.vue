<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantClasses,
      sizeClasses,
    ]"
  >
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps } from 'vue';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  variant?: BadgeVariant;
  size?: BadgeSize;
}>(), {
  variant: 'primary',
  size: 'md',
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary-100 text-primary-800'; // Assuming primary-100 and primary-800 from tailwind config
    case 'secondary':
      return 'bg-gray-100 text-gray-800';
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs';
    case 'md':
      return 'px-2.5 py-0.5 text-sm';
    case 'lg':
      return 'px-3 py-0.5 text-base';
    default:
      return 'px-2.5 py-0.5 text-sm';
  }
});
</script>