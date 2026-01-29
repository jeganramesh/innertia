<template>
  <Card class="flex flex-col h-full">
    <ChatHeader :bot-name="botName" :bot-avatar-url="botAvatarUrl" :bot-status="botStatus" @openSettings="emit('openSettings')" />
    <MessageList :messages="messages" />
    <TypingIndicator :is-typing="isTyping" />
    <SuggestedPrompts v-if="suggestedPrompts.length > 0" :prompts="suggestedPrompts" @select-prompt="emit('selectPrompt')" />
    <ChatInput @send-message="emit('sendMessage')" @file-upload="emit('fileUpload')" />
  </Card>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, defineEmits } from 'vue';
import Card from '@/components/common/Card.vue';
import ChatHeader from './ChatHeader.vue';
import MessageList from './MessageList.vue';
import TypingIndicator from './TypingIndicator.vue';
import SuggestedPrompts from './SuggestedPrompts.vue';
import ChatInput from './ChatInput.vue';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  senderAvatar?: string;
}

const props = withDefaults(defineProps<{
  messages: ChatMessage[];
  isTyping?: boolean;
  botName?: string;
  botAvatarUrl?: string;
  botStatus?: string;
  suggestedPrompts?: string[];
}>(), {
  messages: () => [],
  isTyping: false,
  botName: 'AI Assistant',
  botAvatarUrl: 'https://www.gravatar.com/avatar/?d=retro&s=100',
  botStatus: 'Online',
  suggestedPrompts: () => [],
});

const emit = defineEmits(['sendMessage', 'fileUpload', 'openSettings', 'selectPrompt']);
</script>