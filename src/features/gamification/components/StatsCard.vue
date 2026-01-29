<template>
  <Card class="p-4 flex items-center space-x-4 hover:shadow-soft-sm">
    <div class="flex-shrink-0 text-3xl" :class="iconColorClass">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <div>
      <p class="text-sm text-gray-500">{{ title }}</p>
      <p class="text-xl font-bold text-gray-800">{{ value }}</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, computed } from 'vue';
import Card from '@/components/common/Card.vue';

type IconColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

const props = withDefaults(defineProps<{
  icon?: string;
  title: string;
  value: string | number;
  iconColor?: IconColor;
}>(), {
  icon: '✨',
  iconColor: 'primary',
});

const iconColorClass = computed(() => {
  switch (props.iconColor) {
    case 'primary':
      return 'text-primary';
    case 'success':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'error':
      return 'text-error';
    case 'info':
      return 'text-info';
    default:
      return 'text-gray-500';
  }
});
</script>