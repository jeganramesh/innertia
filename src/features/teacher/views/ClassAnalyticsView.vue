<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
    <div v-else-if="error" class="text-center text-error-600 p-4">
      <EmptyState title="Error Loading Analytics" :message="error.message || 'Failed to fetch class analytics.'" icon="⚠️" />
    </div>
    <div v-else-if="classAnalytics">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Analytics for {{ classAnalytics.className }}</h1>
      <Breadcrumb :items="breadcrumbItems" class="mb-6" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Overall Class Performance -->
        <Card>
          <h2 class="text-xl font-bold text-gray-800 mb-3">Overall Performance</h2>
          <p class="text-3xl font-bold text-primary">{{ classAnalytics.overallScore }}%</p>
          <p class="text-gray-600">Average score across all quizzes</p>
        </Card>

        <!-- Active Students -->
        <Card>
          <h2 class="text-xl font-bold text-gray-800 mb-3">Active Students</h2>
          <p class="text-3xl font-bold text-success">{{ classAnalytics.activeStudents }} / {{ classAnalytics.totalStudents }}</p>
          <p class="text-gray-600">Students actively engaged</p>
        </Card>

        <!-- Average Time per Quiz -->
        <Card>
          <h2 class="text-xl font-bold text-gray-800 mb-3">Avg. Time per Quiz</h2>
          <p class="text-3xl font-bold text-info">{{ classAnalytics.avgTimePerQuiz }} min</p>
          <p class="text-gray-600">Average time spent by students</p>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Student Performance Chart -->
        <Card class="p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Student Performance Overview</h2>
          <EmptyState title="Chart Coming Soon" message="Chart.js integration will display student performance here." />
          <!-- Chart component here -->
        </Card>

        <!-- Quiz-wise Performance Breakdown -->
        <Card class="p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Quiz Performance Breakdown</h2>
          <div class="space-y-4">
            <div v-for="quiz in classAnalytics.quizBreakdown" :key="quiz.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md shadow-sm">
              <div>
                <h4 class="font-medium text-gray-800">{{ quiz.title }}</h4>
                <p class="text-sm text-gray-600">Avg. Score: {{ quiz.averageScore }}%</p>
              </div>
              <Button size="sm" @click="openStudentAnalyticsModal(quiz.id)">View Details</Button>
            </div>
          </div>
          <EmptyState v-if="classAnalytics.quizBreakdown.length === 0" title="No Quizzes Taken" message="Students haven't taken any quizzes yet." />
        </Card>
      </div>

      <!-- Export Options -->
      <div class="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" @click="exportAnalytics('csv')">Export CSV</Button>
        <Button variant="secondary" @click="exportAnalytics('pdf')">Export PDF</Button>
      </div>
    </div>
    <div v-else class="text-center p-8">
      <EmptyState title="Class Not Found" message="The class analytics you are looking for does not exist." icon="🔍" />
    </div>

    <!-- Individual Student Analytics Modal -->
    <Modal :is-open="isStudentAnalyticsModalOpen" :title="`Student Analytics for ${selectedQuizTitle}`" @close="closeStudentAnalyticsModal">
      <div class="p-4">
        <p>Individual student performance data for this quiz will go here.</p>
        <div class="mt-4 flex justify-end">
          <Button @click="closeStudentAnalyticsModal">Close</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFetch } from '@/composables/useFetch';
import { useNotification } from '@/composables/useNotification';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ProgressBar from '@/components/common/ProgressBar.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import Modal from '@/components/common/Modal.vue';

// Mock Data Types
interface QuizPerformance {
  id: string;
  title: string;
  averageScore: number;
}

interface ClassAnalytics {
  id: string;
  className: string;
  overallScore: number;
  totalStudents: number;
  activeStudents: number;
  avgTimePerQuiz: number; // in minutes
  quizBreakdown: QuizPerformance[];
  // Other metrics like topic-wise accuracy, engagement, etc.
}

const route = useRoute();
const notification = useNotification();
const classId = ref(route.params.classId as string);

const analyticsUrl = computed(() => `/classes/${classId.value}/analytics`);
const { data: classAnalytics, loading, error, execute } = useFetch<ClassAnalytics>(analyticsUrl);

const isStudentAnalyticsModalOpen = ref(false);
const selectedQuizTitle = ref('');

const breadcrumbItems = computed(() => [
  { label: 'Teacher Dashboard', to: '/teacher/dashboard' },
  { label: 'Manage Classes', to: '/teacher/manage-class' },
  { label: classAnalytics.value?.className || 'Class Analytics', to: route.path },
]);

onMounted(() => {
  if (classId.value) {
    execute();
  }
});

const openStudentAnalyticsModal = (quizId: string) => {
  const quiz = classAnalytics.value?.quizBreakdown.find(q => q.id === quizId);
  if (quiz) {
    selectedQuizTitle.value = quiz.title;
    isStudentAnalyticsModalOpen.value = true;
  }
};

const closeStudentAnalyticsModal = () => {
  isStudentAnalyticsModalOpen.value = false;
  selectedQuizTitle.value = '';
};

const exportAnalytics = (format: 'csv' | 'pdf') => {
  notification.info(`Exporting analytics to ${format.toUpperCase()}... (Functionality not yet implemented)`);
  // Implement actual export logic here
};
</script>