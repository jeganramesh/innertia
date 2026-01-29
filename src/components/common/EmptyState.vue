<template>
  <div :class="['text-center py-8 px-4', className]">
    <div v-if="icon" class="text-5xl mb-4">{{ icon }}</div>
    
    <div v-else-if="!customIcon && !$slots.icon">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    
    <slot name="icon">
      <div v-if="customIcon" class="mx-auto h-12 w-12 text-gray-400">
        <component :is="customIcon" class="h-full w-full" />
      </div>
    </slot>
    
    <h3 v-if="title" class="mt-2 text-lg font-semibold text-gray-900">{{ title }}</h3>
    <slot name="title" />
    
    <p v-if="message" class="mt-1 text-sm text-gray-500 max-w-md mx-auto">{{ message }}</p>
    <slot name="message" />
    
    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface Props {
  icon?: string;
  title?: string;
  message?: string;
  customIcon?: any;
  className?: string;
}

defineProps<Props>();
</script>