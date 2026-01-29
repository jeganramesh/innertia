<template>
  <div :class="['flex items-end', isUser ? 'justify-end' : 'justify-start']">
    <div
      v-if="!isUser"
      class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm mr-2"
    >
      <img v-if="senderAvatar" :src="senderAvatar" alt="Avatar" class="w-full h-full rounded-full object-cover" />
      <span v-else>BOT</span>
    </div>
    <div
      :class="[
        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-soft-md transition-all',
        isUser ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
      ]"
    >
      <p class="text-sm">{{ message }}</p>
      <div v-if="timestamp" :class="['text-xs mt-1', isUser ? 'text-indigo-100' : 'text-gray-500']">
        {{ formattedTimestamp }}
      </div>
    </div>
    <div
      v-if="isUser"
      class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm ml-2"
    >
      <img v-if="senderAvatar" :src="senderAvatar" alt="Avatar" class="w-full h-full rounded-full object-cover" />
      <span v-else>YOU</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps } from 'vue';

const props = withDefaults(defineProps<{
  message: string;
  isUser: boolean;
  timestamp?: Date;
  senderAvatar?: string;
}>(), {
  isUser: false,
});

const formattedTimestamp = computed(() => {
  if (props.timestamp) {
    return props.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return '';
});
</script>