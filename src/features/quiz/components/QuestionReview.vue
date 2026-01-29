<template>
  <Card class="p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-4">Question {{ questionNumber }}: {{ question.text }}</h2>
    <div class="prose max-w-none mb-6">
      <img v-if="question.imageUrl" :src="question.imageUrl" :alt="question.text" class="my-4 rounded-lg max-h-60 object-contain mx-auto" />
      <audio v-if="question.audioUrl" controls class="my-4 w-full"><source :src="question.audioUrl" type="audio/mpeg"></audio>
    </div>

    <div class="space-y-3 mb-6">
      <div
        v-for="option in question.options"
        :key="option.value"
        :class="[
          'w-full text-left p-3 border rounded-lg transition-colors',
          { 'bg-success-100 border-success text-success-800': option.value === question.correctAnswer },
          { 'bg-error-100 border-error text-error-800': selectedAnswer === option.value && selectedAnswer !== question.correctAnswer },
          { 'bg-white border-gray-300 text-gray-700': option.value !== question.correctAnswer && selectedAnswer !== option.value },
        ]"
      >
        <span class="font-medium">{{ option.label }}</span>
        <span v-if="option.value === question.correctAnswer" class="ml-2 text-success-700"> (Correct Answer)</span>
        <span v-else-if="selectedAnswer === option.value" class="ml-2 text-error-700"> (Your Answer)</span>
      </div>
    </div>

    <div v-if="question.explanation" class="p-4 bg-gray-50 rounded-lg text-gray-700 shadow-soft-sm">
      <h3 class="font-semibold mb-2">Explanation:</h3>
      <p>{{ question.explanation }}</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { withDefaults, defineProps } from 'vue';
import Card from '@/components/common/Card.vue';

interface QuestionOption {
  label: string;
  value: string | number;
}

interface ReviewedQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
  imageUrl?: string;
  audioUrl?: string;
  correctAnswer: string | number;
  explanation?: string;
}

const props = withDefaults(defineProps<{
  question: ReviewedQuestion;
  questionNumber: number;
  selectedAnswer: string | number | null;
}>(), {
  questionNumber: 1,
  selectedAnswer: null,
});
</script>