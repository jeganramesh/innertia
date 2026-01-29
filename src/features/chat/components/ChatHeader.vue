<template>
  <div class="flex items-center justify-between p-4 shadow-soft-sm bg-white">
    <div class="flex items-center space-x-3">
      <img :src="botAvatarUrl" alt="Bot Avatar" class="w-10 h-10 rounded-full object-cover" />
      <div>
        <h2 class="text-lg font-semibold text-gray-800">{{ botName }}</h2>
        <p class="text-sm text-gray-500">{{ botStatus }}</p>
      </div>
    </div>
    <div>
      <Button variant="ghost" size="sm" @click="emit('openSettings')" aria-label="Chat settings">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996-.608 2.296-.07 2.572 1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, defineEmits } from 'vue';
import Button from '@/components/common/Button.vue';

const props = withDefaults(defineProps<{
  botName?: string;
  botAvatarUrl?: string;
  botStatus?: string;
}>(), {
  botName: 'AI Assistant',
  botAvatarUrl: 'https://www.gravatar.com/avatar/?d=retro&s=100', // Example avatar
  botStatus: 'Online',
});

const emit = defineEmits(['openSettings']);
</script>