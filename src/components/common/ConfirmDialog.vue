<template>
  <Modal :is-open="isOpen" :title="title" @close="emit('cancel')">
    <div class="p-4">
      <p class="text-gray-700">{{ message }}</p>
      <div class="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" @click="emit('cancel')">Cancel</Button>
        <Button variant="danger" @click="emit('confirm')">Confirm</Button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, defineEmits } from 'vue';
import Modal from './Modal.vue';
import Button from './Button.vue';

const props = withDefaults(defineProps<{
  isOpen: boolean;
  title?: string;
  message: string;
}>(), {
  isOpen: false,
  title: 'Confirm Action',
  message: 'Are you sure you want to perform this action?',
});

const emit = defineEmits(['confirm', 'cancel']);
</script>