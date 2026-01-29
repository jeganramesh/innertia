<template>
  <Card class="flex flex-col h-full hover:shadow-soft-lg">
    <img :src="course.imageUrl || 'https://via.placeholder.com/300x150/6366F1/FFFFFF?text=Course'" :alt="course.title" class="w-full h-40 object-cover rounded-t-lg" />
    <div class="p-4 flex flex-col flex-grow">
      <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ course.title }}</h3>
      <p class="text-gray-600 text-sm flex-grow">{{ course.description }}</p>
      <div class="flex justify-between items-center mt-4 text-sm text-gray-500">
        <span>Level: {{ course.level }}</span>
        <span>Lessons: {{ course.lessonCount }}</span>
      </div>
      <div class="mt-4 flex justify-between items-center">
        <Badge :variant="course.status === 'enrolled' ? 'success' : 'info'">{{ course.status }}</Badge>
        <Button size="sm" @click="emit('enroll', course.id)">
          {{ course.status === 'enrolled' ? 'Continue' : 'Enroll Now' }}
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { defineProps, withDefaults, defineEmits } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  level: string;
  lessonCount: number;
  status: 'available' | 'enrolled' | 'completed';
}

const props = withDefaults(defineProps<{
  course: Course;
}>(), {});

const emit = defineEmits(['enroll']);
</script>