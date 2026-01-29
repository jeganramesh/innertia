<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Create New Quiz</h1>

    <Tabs :tabs="quizCreationTabs" v-model="activeTab" class="mb-6">
      <template #settings>
        <QuizForm @submit="handleQuizSettingsSubmit" @cancel="handleCancel" />
      </template>
      <template #questions>
        <QuestionBuilder v-model="quizQuestions" />
        <div class="mt-6 flex justify-end">
          <Button type="button" variant="primary" @click="handlePreviewQuiz">Preview Quiz</Button>
          <Button type="button" variant="success" @click="handlePublishQuiz" class="ml-3">Publish Quiz</Button>
        </div>
      </template>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNotification } from '@/composables/useNotification';
import Tabs from '@/components/common/Tabs.vue';
import QuizForm from '@/components/forms/QuizForm.vue';
import QuestionBuilder from '@/components/forms/QuestionBuilder.vue';
import Button from '@/components/common/Button.vue';

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: { label: string; value: string }[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

const router = useRouter();
const notification = useNotification();

const activeTab = ref('settings'); // Default active tab
const quizCreationTabs = [
  { label: 'Quiz Settings', value: 'settings' },
  { label: 'Questions', value: 'questions' },
];

const quizSettings = ref({}); // To store settings from QuizForm
const quizQuestions = ref<QuizQuestion[]>([]); // To store questions from QuestionBuilder

const handleQuizSettingsSubmit = (formData: any) => {
  quizSettings.value = formData;
  notification.success('Quiz settings saved. Now add questions!');
  activeTab.value = 'questions'; // Move to questions tab
};

const handlePreviewQuiz = () => {
  console.log('Quiz Settings:', quizSettings.value);
  console.log('Quiz Questions:', quizQuestions.value);
  notification.info('Preview functionality not yet fully implemented.');
  // Logic to open a quiz preview modal/page
};

const handlePublishQuiz = () => {
  if (quizQuestions.value.length === 0) {
    notification.error('Please add at least one question before publishing.');
    activeTab.value = 'questions';
    return;
  }
  console.log('Publishing Quiz:', { settings: quizSettings.value, questions: quizQuestions.value });
  notification.success('Quiz published successfully!');
  // Simulate API call to publish quiz
  router.push('/teacher/dashboard'); // Redirect after publishing
};

const handleCancel = () => {
  notification.info('Quiz creation cancelled.');
  router.push('/teacher/dashboard'); // Redirect if cancelled
};
</script>