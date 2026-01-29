<template>
  <div class="w-full">
    <div class="flex justify-between text-sm font-medium text-gray-600 mb-1">
      <span>Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}</span>
      <span>{{ progressPercentage }}% Complete</span>
    </div>
    <ProgressBar :percentage="progressPercentage" color="primary" />
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps } from 'vue';
import ProgressBar from '@/components/common/ProgressBar.vue';

const props = withDefaults(defineProps<{
  currentQuestionIndex: number;
  totalQuestions: number;
}>(), {
  currentQuestionIndex: 0,
  totalQuestions: 1,
});

const progressPercentage = computed(() => {
  if (props.totalQuestions === 0) return 0;
  return Math.floor(((props.currentQuestionIndex + 1) / props.totalQuestions) * 100);
});
</script>