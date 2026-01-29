<template>
  <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref="messageListContainer" role="log" aria-live="polite">
    <MessageBubble
      v-for="message in messages"
      :key="message.id"
      :message="message.text"
      :is-user="message.isUser"
      :timestamp="message.timestamp"
      :sender-avatar="message.senderAvatar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, defineProps, withDefaults } from 'vue';
import MessageBubble from './MessageBubble.vue';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  senderAvatar?: string;
}

const props = withDefaults(defineProps<{
  messages: ChatMessage[];
}>(), {
  messages: () => [],
});

const messageListContainer = ref<HTMLElement | null>(null);

// Scroll to bottom when new messages arrive
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (messageListContainer.value) {
      messageListContainer.value.scrollTop = messageListContainer.value.scrollHeight;
    }
  });
}, { deep: true }); // Use deep watch for messages array
</script>