<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Explore Courses</h1>

    <!-- Search and Filter Section -->
    <div class="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
      <Input
        v-model="searchQuery"
        placeholder="Search courses..."
        type="search"
        class="flex-grow"
      />
      <Dropdown
        :options="subjectOptions"
        v-model="selectedSubject"
        placeholder="Filter by Subject"
        class="w-full md:w-auto"
      />
      <Dropdown
        :options="difficultyOptions"
        v-model="selectedDifficulty"
        placeholder="Filter by Difficulty"
        class="w-full md:w-auto"
      />
      <!-- Add more filters as needed -->
      <Button @click="applyFilters" class="w-full md:w-auto">Apply Filters</Button>
      <Button variant="ghost" @click="resetFilters" class="w-full md:w-auto">Reset</Button>
    </div>

    <!-- Course Grid -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
    <div v-else-if="fetchError" class="text-center text-error-600 p-4">
      <EmptyState title="Error" :message="fetchError.message || 'Failed to load courses.'" icon="⚠️" />
    </div>
    <div v-else-if="courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CourseCard v-for="course in courses" :key="course.id" :course="course" @enroll="handleEnroll" />
    </div>
    <div v-else class="text-center p-8">
      <EmptyState title="No Courses Found" message="Try adjusting your search or filters." icon="🤷" />
    </div>

    <!-- Pagination or Infinite Scroll would go here -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useFetch } from '@/composables/useFetch';
import { useDebounce } from '@/composables/useDebounce';
import CourseCard from '@/features/course/components/CourseCard.vue';
import Input from '@/components/common/Input.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import Button from '@/components/common/Button.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';

// Mock data types (should ideally come from a types file)
interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  level: string;
  lessonCount: number;
  status: 'available' | 'enrolled' | 'completed';
}

const courses = ref<Course[]>([]);
const searchQuery = ref('');
const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounced ref

const selectedSubject = ref<string | null>(null);
const subjectOptions = [
  { label: 'Programming', value: 'programming' },
  { label: 'Design', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
];

const selectedDifficulty = ref<string | null>(null);
const difficultyOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

// Computed property for the fetch URL
const fetchUrl = computed(() => {
  const params = new URLSearchParams();
  if (debouncedSearchQuery.value) { // Use .value for debounced ref
    params.append('search', debouncedSearchQuery.value as string);
  }
  if (selectedSubject.value) {
    params.append('subject', selectedSubject.value);
  }
  if (selectedDifficulty.value) {
    params.append('difficulty', selectedDifficulty.value);
  }
  // Add other filters/sort options here
  return `/courses?${params.toString()}`;
});

// Use useFetch composable for data fetching
const { data, loading, error: fetchError, execute } = useFetch<Course[]>(fetchUrl); // Pass computed ref directly

watch(data, (newCourses) => {
  if (newCourses) {
    courses.value = newCourses;
  }
});

// Initial fetch is handled by useFetch's immediate option (true by default)

// Watch changes in filters and trigger fetch
watch([debouncedSearchQuery, selectedSubject, selectedDifficulty], () => {
  execute();
});

const applyFilters = () => {
  execute(); // Trigger fetch with current fetchUrl
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedSubject.value = null;
  selectedDifficulty.value = null;
  // fetchUrl will reactively update and trigger execute
};

const handleEnroll = (courseId: string) => {
  console.log(`Enrolling in course: ${courseId}`);
  // Logic to enroll user in course, update status, etc.
};
</script>