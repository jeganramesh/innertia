<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Create New Lesson</h1>

    <LessonForm @submit="handleLessonSubmit" @cancel="handleCancel" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useNotification } from '@/composables/useNotification';
import LessonForm from '@/components/forms/LessonForm.vue';

const router = useRouter();
const notification = useNotification();

const handleLessonSubmit = (formData: any) => {
  console.log('Lesson submitted from CreateLessonView:', formData);
  notification.success('Lesson created successfully!');
  router.push('/teacher/dashboard'); // Redirect after submission
};

const handleCancel = () => {
  notification.info('Lesson creation cancelled.');
  router.push('/teacher/dashboard'); // Redirect if cancelled
};
</script>