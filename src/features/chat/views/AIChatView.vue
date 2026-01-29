<template>
  <div class="p-6 bg-gray-50 min-h-screen flex flex-col">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">AI Chat Assistant</h1>

    <div class="flex-1 min-h-0">
      <ChatContainer
        :messages="chatMessages"
        :is-typing="botTyping"
        :suggested-prompts="suggestedPrompts"
        @send-message="handleSendMessage"
        @file-upload="handleFileUpload"
        @open-settings="handleOpenSettings"
        @select-prompt="handleSelectPrompt"
        class="h-full"
      />
    </div>

    <!-- Chat Settings Modal -->
    <Modal :is-open="isSettingsModalOpen" title="Chat Settings" @close="closeSettingsModal">
      <div class="p-4">
        <p>Chat settings options will go here...</p>
        <div class="mt-4 flex justify-end">
          <Button @click="closeSettingsModal">Close</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ChatContainer from '@/features/chat/components/ChatContainer.vue';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  senderAvatar?: string;
}

const chatMessages = ref<ChatMessage[]>([
  { id: '1', text: 'Hello! How can I assist you today?', isUser: false, timestamp: new Date(), senderAvatar: 'https://www.gravatar.com/avatar/?d=retro&s=100' },
]);
const botTyping = ref(false);
const suggestedPrompts = ref([
  'What is machine learning?',
  'Explain Vue.js reactivity.',
  'Help me with this code snippet.',
]);
const isSettingsModalOpen = ref(false);

const handleSendMessage = (message: string) => {
  const newMessage: ChatMessage = {
    id: Date.now().toString(),
    text: message,
    isUser: true,
    timestamp: new Date(),
    senderAvatar: 'https://www.gravatar.com/avatar/?d=mp&s=100', // User avatar
  };
  chatMessages.value.push(newMessage);

  // Simulate AI response
  botTyping.value = true;
  setTimeout(() => {
    botTyping.value = false;
    const botResponse: ChatMessage = {
      id: Date.now().toString() + '-bot',
      text: `You said: "${message}". I'm still learning, but I can tell you more about that!`,
      isUser: false,
      timestamp: new Date(),
      senderAvatar: 'https://www.gravatar.com/avatar/?d=retro&s=100',
    };
    chatMessages.value.push(botResponse);
  }, 1500);
};

const handleFileUpload = () => {
  alert('File upload functionality not yet implemented!');
  // Implement file upload logic here
};

const handleOpenSettings = () => {
  isSettingsModalOpen.value = true;
};

const closeSettingsModal = () => {
  isSettingsModalOpen.value = false;
};

const handleSelectPrompt = (prompt: string) => {
  handleSendMessage(prompt);
};
</script>