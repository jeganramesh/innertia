<template>
  <button
    @click="emit('select', option.value)"
    :class="[
      'w-full text-left p-3 border rounded-lg transition-colors',
      { 'bg-primary-100 border-primary text-primary-800': isSelected },
      { 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-primary hover:shadow-soft-sm': !isSelected && !isCorrect && !isIncorrect },
      { 'bg-success-100 border-success text-success-800': isCorrect },
      { 'bg-error-100 border-error text-error-800': isIncorrect },
      { 'cursor-not-allowed opacity-75': disabled }
    ]"
    :disabled="disabled"
  >
    <slot>{{ option.label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { defineProps, withDefaults, defineEmits } from 'vue';

interface AnswerOption {
  label: string;
  value: string | number;
}

const props = withDefaults(defineProps<{
  option: AnswerOption;
  isSelected?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  disabled?: boolean;
}>(), {
  isSelected: false,
  isCorrect: false,
  isIncorrect: false,
  disabled: false,
});

const emit = defineEmits(['select']);
</script>