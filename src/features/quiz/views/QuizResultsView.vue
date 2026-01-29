<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
    <div v-else-if="error" class="text-center text-error-600 p-4">
      <EmptyState title="Error Loading Results" :message="error.message || 'Failed to fetch quiz results.'" icon="⚠️" />
    </div>
    <div v-else-if="quizResult">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Quiz Results: {{ quizResult.quizTitle }}</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-1">
          <ResultsBreakdown
            :score="quizResult.score"
            :total-questions="quizResult.questions.length"
            :time-taken-seconds="quizResult.timeTakenSeconds"
            @retake="handleRetakeQuiz"
            @review="showReview = true"
          />
        </div>
        <Card class="lg:col-span-2 p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Summary</h2>
          <div class="grid grid-cols-2 gap-4 text-gray-700">
            <div>
              <p><span class="font-semibold">Score:</span> {{ quizResult.score }} / {{ quizResult.questions.length }}</p>
              <p><span class="font-semibold">Percentage:</span> {{ Math.round((quizResult.score / quizResult.questions.length) * 100) || 0 }}%</p>
            </div>
            <div>
              <p><span class="font-semibold">Time Taken:</span> {{ formatTime(quizResult.timeTakenSeconds) }}</p>
              <p><span class="font-semibold">Status:</span>
                <Badge :variant="quizResult.score / quizResult.questions.length >= 0.7 ? 'success' : 'error'">
                  {{ quizResult.score / quizResult.questions.length >= 0.7 ? 'Passed' : 'Failed' }}
                </Badge>
              </p>
            </div>
          </div>
          <div class="mt-4 flex justify-end space-x-3">
            <Button variant="ghost" @click="handleShareResults">Share Results</Button>
            <Button @click="handleNextQuiz">Next Quiz</Button>
          </div>
        </Card>
      </div>

      <div v-if="showReview" class="mt-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Detailed Answer Review</h2>
        <div class="space-y-8">
          <QuestionReview
            v-for="(question, index) in quizResult.questions"
            :key="question.id"
            :question="question"
            :question-number="index + 1"
            :selected-answer="quizResult.userAnswers[question.id]"
          />
        </div>
      </div>
    </div>
    <div v-else class="text-center p-8">
      <EmptyState title="Results Not Found" message="The quiz results you are looking for do not exist." icon="🔍" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFetch } from '@/composables/useFetch';
import { useNotification } from '@/composables/useNotification';
import { quizService } from '@/features/quiz/services/quizService';

import ResultsBreakdown from '@/features/quiz/components/ResultsBreakdown.vue';
import QuestionReview from '@/features/quiz/components/QuestionReview.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Badge from '@/components/common/Badge.vue';

// Mock Data Types
interface QuizQuestionReviewed {
  id: string;
  text: string;
  options: { label: string; value: string | number }[];
  imageUrl?: string;
  audioUrl?: string;
  correctAnswer: string | number;
  explanation?: string;
}

interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  questions: QuizQuestionReviewed[];
  userAnswers: Record<string, string | number | null>; // Map questionId to selectedAnswer
}

const route = useRoute();
const router = useRouter();
const notification = useNotification();

const resultId = ref(route.params.resultId as string);
const showReview = ref(false);

const resultsUrl = computed(() => `/quiz-results/${resultId.value}`);
const { data: quizResult, loading, error, execute } = useFetch<QuizResult>(resultsUrl);

onMounted(() => {
  if (resultId.value) {
    execute();
  }
});

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}m ${remainingSeconds.toString().padStart(2, '0')}s`;
};

const handleRetakeQuiz = () => {
  if (quizResult.value?.quizId) {
    router.push({ name: 'quiz-play', params: { quizId: quizResult.value.quizId } });
  } else {
    notification.error('Cannot retake quiz: Quiz ID not found.');
  }
};

const handleShareResults = () => {
  notification.info('Share functionality not yet implemented!');
  // Implement actual share logic (e.g., social media share, copy link)
};

const handleNextQuiz = () => {
  notification.info('Next quiz functionality not yet implemented!');
  // Logic to navigate to the next recommended quiz
  router.push('/'); // Example: go to home page
};
</script>