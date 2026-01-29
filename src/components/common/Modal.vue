<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-50 flex" @click.self="emit('close')">
      <div class="relative p-4 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-soft-lg" role="dialog" aria-modal="true">
        <div class="flex justify-between items-center pb-3 border-b">
          <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600" aria-label="Close modal">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="py-3">
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults } from 'vue';

const props = withDefaults(defineProps<{
  isOpen: boolean;
  title?: string;
}>(), {
  isOpen: false,
  title: 'Modal Title',
});

const emit = defineEmits(['close']);
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.3s ease-in-out;
}

.modal-fade-enter-from .relative {
  transform: scale(0.9);
}
.modal-fade-leave-to .relative {
  transform: scale(0.9);
}
</style>