<template>
  <div class="bg-white rounded-lg shadow-soft-md p-6 mb-6">
    <div class="flex items-center space-x-4 mb-4">
      <img :src="course.imageUrl || 'https://via.placeholder.com/100x100/6366F1/FFFFFF?text=Course'" :alt="course.title" class="w-24 h-24 object-cover rounded-lg" />
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ course.title }}</h1>
        <p class="text-lg text-gray-600">by {{ course.teacher }}</p>
      </div>
    </div>

    <div class="flex items-center space-x-4 text-gray-500 text-sm mb-4">
      <div class="flex items-center">
        <span class="mr-1">⭐</span>
        <span>{{ course.rating }} ({{ course.reviews }} reviews)</span>
      </div>
      <span><span class="font-medium">{{ course.studentsEnrolled }}</span> Students Enrolled</span>
      <span>{{ course.level }} Level</span>
    </div>

    <p class="text-gray-700 mb-4">{{ course.description }}</p>

    <div class="flex space-x-4 items-center">
      <Button v-if="!course.isEnrolled" @click="emit('enroll', course.id)">Enroll Now</Button>
      <Button v-else variant="secondary">Continue Course</Button>
      <Button variant="ghost">Share</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, withDefaults, defineEmits } from 'vue';
import Button from '@/components/common/Button.vue';

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  teacher: string;
  rating: number;
  reviews: number;
  studentsEnrolled: number;
  level: string;
  isEnrolled: boolean;
}

const props = withDefaults(defineProps<{
  course: CourseDetails;
}>(), {});

const emit = defineEmits(['enroll']);
</script>