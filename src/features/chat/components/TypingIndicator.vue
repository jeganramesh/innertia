<template>
  <transition name="fade">
    <div v-if="isTyping" class="flex items-center space-x-2 p-2">
      <div class="dot-flashing"></div>
      <span class="text-gray-500 text-sm">AI Assistant is typing...</span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { withDefaults, defineProps } from 'vue';

const props = withDefaults(defineProps<{
  isTyping?: boolean;
}>(), {
  isTyping: false,
});
</script>

<style scoped>
.dot-flashing {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 5px;
  background-color: theme('colors.gray.400');
  color: theme('colors.gray.400');
  animation: dotFlashing 1s infinite linear alternate;
  animation-delay: 0.5s;
}

.dot-flashing::before, .dot-flashing::after {
  content: '';
  display: inline-block;
  position: absolute;
  top: 0;
}

.dot-flashing::before {
  left: -12px;
  width: 8px;
  height: 8px;
  border-radius: 5px;
  background-color: theme('colors.gray.400');
  color: theme('colors.gray.400');
  animation: dotFlashing 1s infinite linear alternate;
  animation-delay: 0s;
}

.dot-flashing::after {
  left: 12px;
  width: 8px;
  height: 8px;
  border-radius: 5px;
  background-color: theme('colors.gray.400');
  color: theme('colors.gray.400');
  animation: dotFlashing 1s infinite linear alternate;
  animation-delay: 1s;
}

@keyframes dotFlashing {
  0% {
    background-color: theme('colors.gray.400');
  }
  50%, 100% {
    background-color: theme('colors.gray.200');
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
