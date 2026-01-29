<template>
  <aside class="w-full lg:w-80 bg-white rounded-lg shadow-soft-md p-4 h-full overflow-y-auto">
    <h3 class="text-xl font-bold text-gray-800 mb-4">Course Content</h3>
    <ul class="space-y-2">
      <li v-for="lesson in lessons" :key="lesson.id">
        <router-link
          :to="{ name: 'lesson-player', params: { courseId: courseId, lessonId: lesson.id } }"
          :class="[
            'flex items-center p-3 rounded-md transition-colors',
            { 'bg-primary-50 text-primary-700 font-medium': activeLessonId === lesson.id },
            { 'hover:bg-gray-100 text-gray-700': activeLessonId !== lesson.id }
          ]"
        >
          <span class="mr-3">{{ lesson.completed ? '✅' : '▶️' }}</span>
          <div>
            <p class="text-sm leading-tight">{{ lesson.title }}</p>
            <ProgressBar v-if="lesson.progress > 0 && !lesson.completed" :percentage="lesson.progress" class="mt-1 h-1 w-16" />
          </div>
        </router-link>
      </li>
    </ul>
    <EmptyState v-if="lessons.length === 0" title="No Lessons" message="No lessons found for this course." class="mt-4" />
  </aside>
</template>

<script setup lang="ts">
import { defineProps, withDefaults } from 'vue';
import ProgressBar from '@/components/common/ProgressBar.vue';
import EmptyState from '@/components/common/EmptyState.vue';

interface Lesson {
  id: string;
  title: string;
  progress: number; // 0-100
  completed: boolean;
}

const props = withDefaults(defineProps<{
  courseId: string;
  lessons: Lesson[];
  activeLessonId?: string;
}>(), {
  lessons: () => [],
  activeLessonId: '',
});
</script>