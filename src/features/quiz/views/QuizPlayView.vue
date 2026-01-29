<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
    <div v-else-if="error" class="text-center text-error-600 p-4">
      <EmptyState title="Error Loading Quiz" :message="error.message || 'Failed to fetch quiz content.'" icon="⚠️" />
    </div>
    <div v-else-if="quiz">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">{{ quiz.title }}</h1>
        <div class="flex items-center space-x-4">
          <TimerDisplay :remaining-seconds="timer.remaining.value" />
          <Badge variant="info">{{ quiz.difficulty }}</Badge>
        </div>
      </div>

      <div class="mb-6">
        <QuizProgress :current-question-index="currentQuestionIndex" :total-questions="quiz.questions.length" />
      </div>

      <QuestionCard
        v-if="currentQuestion"
        :question="currentQuestion"
        :question-number="currentQuestionIndex + 1"
        :selected-answer="userAnswers[currentQuestionIndex]"
        :disabled="quizSubmitted || timer.isExpired.value"
        @answer-selected="handleAnswerSelected"
      />
      <EmptyState v-else title="No Questions" message="This quiz has no questions yet." class="mt-8" />

      <div class="mt-6 flex justify-between">
        <Button @click="previousQuestion" :disabled="currentQuestionIndex === 0 || quizSubmitted">Previous</Button>
        <div class="flex space-x-3">
          <Button variant="ghost" @click="markForReview" :disabled="quizSubmitted">
            {{ questionsForReview.includes(currentQuestionIndex) ? 'Unmark for Review' : 'Mark for Review' }}
          </Button>
          <Button v-if="currentQuestionIndex < quiz.questions.length - 1" @click="nextQuestion" :disabled="quizSubmitted">Next</Button>
          <Button v-else @click="submitQuiz" :disabled="quizSubmitted" variant="primary">Submit Quiz</Button>
        </div>
      </div>
    </div>
    <div v-else class="text-center p-8">
      <EmptyState title="Quiz Not Found" message="The quiz you are looking for does not exist." icon="🔍" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFetch } from '@/composables/useFetch';
import { useTimer } from '@/composables/useTimer';
import { useNotification } from '@/composables/useNotification';
import { quizService } from '@/features/quiz/services/quizService';

import QuestionCard from '@/features/quiz/components/QuestionCard.vue';
import TimerDisplay from '@/features/quiz/components/TimerDisplay.vue';
import QuizProgress from '@/features/quiz/components/QuizProgress.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';

// Mock Data Types
interface QuizQuestion {
  id: string;
  text: string;
  options: { label: string; value: string | number }[];
  imageUrl?: string;
  audioUrl?: string;
  type: 'multiple-choice' | 'true-false';
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number; // in seconds
  questions: QuizQuestion[];
}

const route = useRoute();
const router = useRouter();
const notification = useNotification();

const quizId = ref(route.params.quizId as string);
const quizUrl = computed(() => `/quizzes/${quizId.value}`);
const { data: quiz, loading, error, execute } = useFetch<Quiz>(quizUrl);

const currentQuestionIndex = ref(0);
const userAnswers = ref<Record<number, string | number | null>>({});
const questionsForReview = ref<number[]>([]);
const quizSubmitted = ref(false);

const timer = useTimer(0); // Initialize with 0, will be updated when quiz data loads

watch(quiz, (newQuiz) => {
  if (newQuiz) {
    timer.reset(newQuiz.timeLimit);
    timer.start();
  }
});

watch(() => timer.isExpired.value, (isExpired) => {
  if (isExpired && !quizSubmitted.value) {
    notification.warning('Time is up! Submitting your quiz automatically.');
    submitQuiz();
  }
});

const currentQuestion = computed(() => {
  if (quiz.value && quiz.value.questions.length > currentQuestionIndex.value) {
    return quiz.value.questions[currentQuestionIndex.value];
  }
  return null;
});

const handleAnswerSelected = (answer: string | number) => {
  userAnswers.value[currentQuestionIndex.value] = answer;
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < (quiz.value?.questions.length || 0) - 1) {
    currentQuestionIndex.value++;
  }
};

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

const markForReview = () => {
  const index = currentQuestionIndex.value;
  if (questionsForReview.value.includes(index)) {
    questionsForReview.value = questionsForReview.value.filter(q => q !== index);
    notification.info('Question unmarked for review.');
  } else {
    questionsForReview.value.push(index);
    notification.info('Question marked for review.');
  }
};

const submitQuiz = async () => {
  if (quizSubmitted.value) return;

  quizSubmitted.value = true;
  timer.stop();
  notification.info('Submitting your quiz...');

  try {
    const answersToSend = Object.entries(userAnswers.value).map(([qIndex, answer]) => ({
      questionId: quiz.value!.questions[parseInt(qIndex)].id,
      selectedAnswer: answer,
    }));
    const result = await quizService.submitQuiz(quizId.value, answersToSend);
    notification.success('Quiz submitted successfully!');
    router.push({ name: 'quiz-results', params: { resultId: result.id } }); // Redirect to results page
  } catch (err: any) {
    notification.error(err.message || 'Failed to submit quiz.');
    quizSubmitted.value = false; // Allow resubmission if network error
  }
};

onMounted(() => {
  if (quizId.value) {
    execute(); // Fetch quiz details
  }
});
</script>