<template>
  <Card class="p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Question {{ questionNumber }}</h2>
    <div class="prose max-w-none mb-6">
      <p>{{ question.text }}</p>
      <img v-if="question.imageUrl" :src="question.imageUrl" :alt="question.text" class="my-4 rounded-lg max-h-60 object-contain mx-auto" />
      <audio v-if="question.audioUrl" controls class="my-4 w-full"><source :src="question.audioUrl" type="audio/mpeg"></audio>
    </div>

    <div class="space-y-3">
      <AnswerOption
        v-for="option in question.options"
        :key="option.value"
        :option="option"
        :is-selected="selectedAnswer === option.value"
        :is-correct="showResults && option.value === question.correctAnswer"
        :is-incorrect="showResults && selectedAnswer === option.value && selectedAnswer !== question.correctAnswer"
        :disabled="disabled || showResults"
        @select="handleAnswerSelect"
      />
    </div>

    <div v-if="showResults && question.explanation" class="mt-6 p-4 bg-gray-50 rounded-lg text-gray-700 shadow-soft-sm">
      <h3 class="font-semibold mb-2">Explanation:</h3>
      <p>{{ question.explanation }}</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, defineEmits } from 'vue';
import Card from '@/components/common/Card.vue';
import AnswerOption from './AnswerOption.vue';

interface QuestionOption {
  label: string;
  value: string | number;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
  imageUrl?: string;
  audioUrl?: string;
  correctAnswer?: string | number; // Only present if results are shown
  explanation?: string; // Only present if results are shown
}

const props = withDefaults(defineProps<{
  question: QuizQuestion;
  questionNumber: number;
  selectedAnswer: string | number | null;
  disabled?: boolean;
  showResults?: boolean;
}>(), {
  questionNumber: 1,
  selectedAnswer: null,
  disabled: false,
  showResults: false,
});

const emit = defineEmits(['answer-selected']);

const handleAnswerSelect = (value: string | number) => {
  if (!props.disabled && !props.showResults) {
    emit('answer-selected', value);
  }
};
</script>