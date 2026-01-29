<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
    <div v-else-if="error" class="text-center text-error-600 p-4">
      <EmptyState title="Error" :message="error.message || 'Failed to load course details.'" icon="⚠️" />
    </div>
    <div v-else-if="course">
      <CourseHeader :course="course" @enroll="handleEnroll" class="mb-6" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <!-- Course Description & Objectives -->
          <Card class="mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-3">About This Course</h2>
            <p class="text-gray-700">{{ course.description }}</p>
            <h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">What you'll learn:</h3>
            <ul class="list-disc list-inside text-gray-700">
              <li v-for="(objective, index) in course.objectives" :key="index">{{ objective }}</li>
            </ul>
          </Card>

          <!-- Lesson List -->
          <Card class="mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Course Content</h2>
            <div class="space-y-4">
              <div v-for="lesson in course.lessons" :key="lesson.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md shadow-sm">
                <div>
                  <h4 class="font-medium text-gray-800">{{ lesson.title }}</h4>
                  <p class="text-sm text-gray-600">{{ lesson.duration }} min</p>
                </div>
                <div class="flex items-center space-x-3">
                  <ProgressBar :percentage="lesson.progress" class="w-24" />
                  <Button size="sm" @click="goToLesson(lesson.id)">
                    {{ lesson.progress === 100 ? 'Review' : 'Start' }}
                  </Button>
                </div>
              </div>
              <EmptyState v-if="course.lessons.length === 0" title="No Lessons" message="No lessons available for this course yet." />
            </div>
          </Card>

          <!-- Reviews/Ratings Section -->
          <Card>
            <h2 class="text-xl font-bold text-gray-800 mb-4">Student Reviews</h2>
            <EmptyState title="No Reviews Yet" message="Be the first to review this course!" />
            <!-- Review components would go here -->
          </Card>
        </div>

        <div class="lg:col-span-1">
          <!-- Related Courses Carousel -->
          <Card class="mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Related Courses</h2>
            <EmptyState title="No Related Courses" message="Check back later for more recommendations." />
            <!-- Related CourseCards would go here -->
          </Card>
        </div>
      </div>
    </div>
    <div v-else>
      <EmptyState title="Course Not Found" message="The course you are looking for does not exist." icon="🔍" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFetch } from '@/composables/useFetch';
import CourseHeader from '@/features/course/components/CourseHeader.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ProgressBar from '@/components/common/ProgressBar.vue';
import { useNotification } from '@/composables/useNotification';

// Mock data types
interface Lesson {
  id: string;
  title: string;
  duration: number;
  progress: number; // 0-100
}

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
  objectives: string[];
  lessons: Lesson[];
}

const route = useRoute();
const router = useRouter();
const notification = useNotification();
const courseId = ref(route.params.id as string);

const courseUrl = computed(() => `/courses/${courseId.value}`);
const { data: course, loading, error, execute } = useFetch<CourseDetails>(courseUrl); // Pass computed ref to useFetch

onMounted(() => {
  if (courseId.value) {
    execute();
  }
});

const handleEnroll = (id: string) => {
  // Simulate enrollment
  console.log(`Enrolling in course: ${id}`);
  notification.success(`Successfully enrolled in ${course.value?.title}!`);
  if (course.value) {
    course.value.isEnrolled = true;
  }
  // Ideally, make an API call here
};

const goToLesson = (lessonId: string) => {
  router.push({ name: 'lesson-player', params: { courseId: courseId.value, lessonId: lessonId } });
};
</script>