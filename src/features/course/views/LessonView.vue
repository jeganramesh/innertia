<template>
  <div class="flex flex-col lg:flex-row h-full p-6 bg-gray-50">
    <div class="flex-grow lg:mr-6 mb-6 lg:mb-0">
      <div v-if="loading" class="flex justify-center items-center h-full bg-white rounded-lg shadow-sm">
        <Spinner size="lg" />
      </div>
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm p-6">
        <EmptyState title="Error Loading Lesson" :message="error.message || 'Failed to fetch lesson content.'" icon="⚠️" />
      </div>
      <div v-else-if="lesson">
        <LessonPlayer :media-type="lesson.mediaType" :media-src="lesson.mediaSrc" class="mb-6" />

        <Card class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ lesson.title }}</h1>
          <p class="text-gray-600 mb-4">{{ lesson.description }}</p>

          <div class="flex items-center justify-between mt-4 border-t pt-4">
            <Button @click="goToPreviousLesson" :disabled="!previousLessonId" variant="secondary">Previous Lesson</Button>
            <Button @click="markAsComplete" :disabled="lesson.completed" variant="primary">
              {{ lesson.completed ? 'Completed' : 'Mark as Complete' }}
            </Button>
            <Button @click="goToNextLesson" :disabled="!nextLessonId" variant="primary">Next Lesson</Button>
          </div>
        </Card>

        <!-- Optional Notes Section -->
        <Card>
          <h2 class="text-xl font-bold text-gray-800 mb-3">My Notes</h2>
          <textarea
            v-model="lessonNotes"
            rows="5"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            placeholder="Write your notes here..."
          ></textarea>
          <Button class="mt-3" @click="saveNotes">Save Notes</Button>
        </Card>
      </div>
      <div v-else class="bg-white rounded-lg shadow-sm p-6">
        <EmptyState title="Lesson Not Found" message="The lesson you are looking for does not exist." icon="🔍" />
      </div>
    </div>

    <!-- Lesson Sidebar -->
    <LessonSidebar
      v-if="courseId && courseLessons.length > 0"
      :course-id="courseId"
      :lessons="courseLessons"
      :active-lesson-id="lessonId"
      class="w-full lg:w-80 flex-shrink-0"
    />
    <Card v-else class="w-full lg:w-80 flex-shrink-0">
      <EmptyState title="No Lessons" message="No lessons found in this course." />
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFetch } from '@/composables/useFetch';
import { useNotification } from '@/composables/useNotification';
import LessonPlayer from '@/features/course/components/LessonPlayer.vue';
import LessonSidebar from '@/features/course/components/LessonSidebar.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { courseService } from '@/features/course/services/courseService'; // Assuming courseService has markLessonAsComplete

// Mock data types (should ideally come from a types file)
interface LessonContent {
  id: string;
  title: string;
  description: string;
  mediaType: 'video' | 'document' | 'text';
  mediaSrc: string;
  completed: boolean;
  notes?: string;
}

interface CourseLessonOverview { // Simplified lesson data for sidebar
  id: string;
  title: string;
  progress: number;
  completed: boolean;
}

const route = useRoute();
const router = useRouter();
const notification = useNotification();

const courseId = ref(route.params.courseId as string);
const lessonId = ref(route.params.lessonId as string);

const lessonUrl = computed(() => `/lessons/${lessonId.value}`);
const { data: lesson, loading, error, execute } = useFetch<LessonContent>(lessonUrl);

// Placeholder for course lessons for the sidebar (would typically be fetched from courseService)
const courseLessons = ref<CourseLessonOverview[]>([
  { id: 'lesson-1', title: 'Introduction to Vue 3', progress: 100, completed: true },
  { id: 'lesson-2', title: 'Vue Router Basics', progress: 50, completed: false },
  { id: 'lesson-3', title: 'State Management with Pinia', progress: 0, completed: false },
]);

const lessonNotes = ref('');

// Fetch lesson content on initial load and when lessonId changes
onMounted(() => {
  execute();
});

watch(lessonId, () => {
  execute();
});

watch(lesson, (newLesson) => {
  if (newLesson && newLesson.notes) {
    lessonNotes.value = newLesson.notes;
  }
});

const currentLessonIndex = computed(() => courseLessons.value.findIndex(l => l.id === lessonId.value));
const previousLessonId = computed(() => {
  if (currentLessonIndex.value > 0) {
    return courseLessons.value[currentLessonIndex.value - 1].id;
  }
  return null;
});
const nextLessonId = computed(() => {
  if (currentLessonIndex.value < courseLessons.value.length - 1) {
    return courseLessons.value[currentLessonIndex.value + 1].id;
  }
  return null;
});

const goToPreviousLesson = () => {
  if (previousLessonId.value) {
    router.push({ name: 'lesson-player', params: { courseId: courseId.value, lessonId: previousLessonId.value } });
  }
};

const goToNextLesson = () => {
  if (nextLessonId.value) {
    router.push({ name: 'lesson-player', params: { courseId: courseId.value, lessonId: nextLessonId.value } });
  }
};

const markAsComplete = async () => {
  if (lesson.value && !lesson.value.completed) {
    try {
      // Simulate API call to mark lesson as complete
      await courseService.markLessonAsComplete(lesson.value.id);
      lesson.value.completed = true;
      notification.success('Lesson marked as complete!');
      // Update sidebar lesson status if necessary
    } catch (err: any) {
      notification.error(err.message || 'Failed to mark lesson as complete.');
    }
  }
};

const saveNotes = () => {
  if (lesson.value) {
    lesson.value.notes = lessonNotes.value;
    notification.info('Notes saved locally!');
    // Ideally, send notes to API to persist
  }
};
</script>