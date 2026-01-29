<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

    <div v-if="user" class="mb-8">
      <h2 class="text-2xl font-semibold text-gray-800">Welcome back, {{ user.name || user.email }}!</h2>
      <p class="text-gray-600">Administer and monitor the platform.</p>
    </div>

    <!-- System Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <h3 class="font-semibold text-lg text-gray-700">Total Students</h3>
        <p class="text-3xl font-bold text-primary mt-2">1,234</p>
      </Card>
      <Card>
        <h3 class="font-semibold text-lg text-gray-700">Upcoming Exams</h3>
        <p class="text-3xl font-bold text-info mt-2">5</p>
      </Card>
      <Card>
        <h3 class="font-semibold text-lg text-gray-700">Active Exams</h3>
        <p class="text-3xl font-bold text-success mt-2">2</p>
      </Card>
      <Card>
        <h3 class="font-semibold text-lg text-gray-700">Completed Exams</h3>
        <p class="text-3xl font-bold text-warning mt-2">15</p>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Student Management -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Student Management</h3>
        <EmptyState title="Manage Students" message="View, enroll, and manage student accounts." />
        <Button class="mt-4" @click="notification.info('Student management page coming soon!')">Go to Student Management</Button>
      </Card>

      <!-- Faculty Management -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Faculty Management</h3>
        <EmptyState title="Manage Faculty" message="View, add, and manage faculty accounts." />
        <Button class="mt-4" @click="notification.info('Faculty management page coming soon!')">Go to Faculty Management</Button>
      </Card>

      <!-- Exam Management -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Exam Management</h3>
        <EmptyState title="Manage Exams" message="Create, schedule, and oversee exams." />
        <Button class="mt-4" @click="notification.info('Exam management page coming soon!')">Go to Exam Management</Button>
      </Card>
    </div>

    <!-- Recent Activity -->
    <div class="mt-8">
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Recent Activity</h3>
        <ul class="space-y-2">
          <li class="text-gray-700">User 'John Doe' created a new quiz "Math Basics". <span class="text-gray-500 text-sm">2 minutes ago</span></li>
          <li class="text-gray-700">Faculty 'Jane Smith' updated lesson "Algebra I". <span class="text-gray-500 text-sm">1 hour ago</span></li>
          <li class="text-gray-700">Student 'Alice Brown' completed quiz "History Exam". <span class="text-gray-500 text-sm">3 hours ago</span></li>
          <li class="text-gray-700">College Admin 'Admin User' added new faculty 'Dr. Evans'. <span class="text-gray-500 text-sm">Yesterday</span></li>
        </ul>
        <EmptyState title="No Recent Activity" message="No recent activities to display." v-if="false" />
        <Button class="mt-4" @click="notification.info('Recent activity logs coming soon!')">View All Activity</Button>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { useNotification } from '@/composables/useNotification';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import EmptyState from '@/components/common/EmptyState.vue';
// Import other components as needed

const { user } = useAuth();
const notification = useNotification();
</script>

<style scoped>
</style>