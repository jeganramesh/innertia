<template>
  <div class="p-4 shadow-soft-sm bg-white flex items-center space-x-3">
    <Input
      v-model="currentMessage"
      placeholder="Type your message..."
      @keyup.enter="sendMessage"
      class="flex-grow"
    />
    <Button @click="sendMessage" :disabled="!currentMessage.trim()">Send</Button>
    <Button variant="secondary" @click="emit('file-upload')" class="flex-shrink-0" aria-label="Attach file">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13.5"></path></svg>
      <span class="sr-only">Attach File</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';

const currentMessage = ref('');
const emit = defineEmits(['send-message', 'file-upload']);

const sendMessage = () => {
  if (currentMessage.value.trim()) {
    emit('send-message', currentMessage.value.trim());
    currentMessage.value = '';
  }
};
</script>