<template>
  <Card class="p-6 text-center">
    <h2 class="text-2xl font-bold text-gray-800 mb-4">Quiz Results</h2>
    <div class="mb-4">
      <p class="text-4xl font-extrabold" :class="scoreColorClass">{{ scorePercentage }}%</p>
      <p class="text-lg text-gray-600">You scored {{ correctAnswers }} out of {{ totalQuestions }} questions correctly.</p>
    </div>

    <div class="grid grid-cols-2 gap-4 text-sm mb-6">
      <div class="p-3 bg-gray-50 rounded-md shadow-soft-sm">
        <p class="text-gray-500">Time Taken</p>
        <p class="font-medium text-gray-800">{{ formattedTimeTaken }}</p>
      </div>
      <div class="p-3 bg-gray-50 rounded-md shadow-soft-sm">
        <p class="text-gray-500">Status</p>
        <Badge :variant="isPassed ? 'success' : 'error'">{{ isPassed ? 'Passed' : 'Failed' }}</Badge>
      </div>
    </div>

    <div class="flex justify-center space-x-4">
      <Button @click="emit('retake')" variant="secondary">Retake Quiz</Button>
      <Button @click="emit('review')" variant="primary">Review Answers</Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps, defineEmits } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';

const props = withDefaults(defineProps<{
  score: number; // Number of correct answers
  totalQuestions: number;
  timeTakenSeconds: number;
  passingScorePercentage?: number;
}>(), {
  score: 0,
  totalQuestions: 0,
  timeTakenSeconds: 0,
  passingScorePercentage: 70, // Default passing score
});

const emit = defineEmits(['retake', 'review']);

const scorePercentage = computed(() => {
  if (props.totalQuestions === 0) return 0;
  return Math.round((props.score / props.totalQuestions) * 100);
});

const isPassed = computed(() => scorePercentage.value >= props.passingScorePercentage);

const scoreColorClass = computed(() => {
  if (isPassed.value) return 'text-success';
  if (scorePercentage.value >= props.passingScorePercentage * 0.7) return 'text-warning';
  return 'text-error';
});

const correctAnswers = computed(() => props.score);

const formattedTimeTaken = computed(() => {
  const minutes = Math.floor(props.timeTakenSeconds / 60);
  const seconds = props.timeTakenSeconds % 60;
  return `${minutes}m ${seconds}s`;
});
</script>