<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Teacher Dashboard</h1>

    <div v-if="user" class="mb-8">
      <h2 class="text-2xl font-semibold text-gray-800">Welcome back, {{ user.name || user.email }}!</h2>
      <p class="text-gray-600">Here's an overview of your classes and students.</p>
    </div>

    <!-- Quick Action Buttons -->
    <div class="mb-8 flex flex-wrap gap-4">
      <Button @click="router.push('/teacher/create-lesson')" variant="primary">Create New Lesson</Button>
      <Button @click="router.push('/teacher/create-quiz')" variant="primary">Create New Quiz</Button>
      <Button @click="router.push('/teacher/manage-class')" variant="secondary">Manage Classes</Button>
      <Button @click="router.push('/teacher/analytics')" variant="ghost">View Analytics</Button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Class Cards Overview -->
      <Card class="lg:col-span-2">
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Your Classes Overview</h3>
        <div v-if="classes.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="cls in classes" :key="cls.id" class="bg-blue-50 p-4 rounded-lg shadow-sm">
            <h4 class="font-bold text-lg text-blue-800">{{ cls.name }}</h4>
            <p class="text-gray-700">Students: {{ cls.students }}</p>
            <p class="text-gray-700">Quizzes: {{ cls.quizzes }}</p>
            <ProgressBar :percentage="cls.progress" class="mt-2" color="primary" />
            <p class="text-sm text-gray-600 mt-1">{{ cls.progress }}% Course Completion</p>
          </div>
        </div>
        <EmptyState v-else title="No Classes Yet" message="Create your first class to get started!" class="mt-4" />
      </Card>

      <!-- Recent Student Activity Feed -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Recent Student Activity</h3>
        <ul class="space-y-3">
          <li class="flex items-center">
            <span class="text-gray-500 mr-2">✅</span>
            <p class="text-gray-700"><span class="font-medium">John Doe</span> completed "Algebra I Quiz".</p>
          </li>
          <li class="flex items-center">
            <span class="text-gray-500 mr-2">📝</span>
            <p class="text-gray-700"><span class="font-medium">Jane Smith</span> started "Geometry Lesson 3".</p>
          </li>
          <li class="flex items-center">
            <span class="text-gray-500 mr-2">🏆</span>
            <p class="text-gray-700"><span class="font-medium">Mike Johnson</span> earned "Math Whiz" badge.</p>
          </li>
        </ul>
        <EmptyState v-if="false" title="No Recent Activity" message="Student activity will appear here." class="mt-4" />
      </Card>
    </div>

    <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Quiz Performance Analytics -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Quiz Performance Analytics</h3>
        <EmptyState title="No Quiz Data" message="Assign quizzes to your students to see performance data." />
        <!-- Chart.js/ECharts component would go here -->
      </Card>

      <!-- Assignment Status Tracker -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Assignment Status Tracker</h3>
        <EmptyState title="No Assignments" message="Create and assign lessons or quizzes to track status." />
        <!-- List of assignments with status -->
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import ProgressBar from '@/components/common/ProgressBar.vue';
import EmptyState from '@/components/common/EmptyState.vue';
// Import other components as needed

const router = useRouter();
const { user } = useAuth();

// Mock data for classes
const classes = ref([
  { id: 'class-1', name: 'Math Grade 8', students: 30, quizzes: 5, progress: 75 },
  { id: 'class-2', name: 'Science Grade 7', students: 25, quizzes: 3, progress: 50 },
]);
</script>

<style scoped>
</style>