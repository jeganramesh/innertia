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
        <h3 class="font-semibold text-lg text-gray-700">Total Users</h3>
        <p class="text-3xl font-bold text-primary mt-2">1,234</p>
      </Card>
      <Card>
        <h3 class="font-semibold text-lg text-gray-700">Active Courses</h3>
        <p class="text-3xl font-bold text-success mt-2">87</p>
      </Card>
      <Card>
        <h3 class="font-semibold text-lg text-gray-700">Total Quizzes</h3>
        <p class="text-3xl font-bold text-warning mt-2">256</p>
      </Card>
      <Card>
        <h3 class="font-semibold text-lg text-gray-700">Storage Used</h3>
        <p class="text-3xl font-bold text-info mt-2">1.2 TB</p>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- User Management Interface -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">User Management</h3>
        <EmptyState title="Manage Users" message="View, edit, and delete user accounts." />
        <Button class="mt-4" @click="notification.info('User management page coming soon!')">Go to User Management</Button>
      </Card>

      <!-- Role Assignment Controls -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Role Assignment</h3>
        <EmptyState title="Assign Roles" message="Control user permissions and roles." />
        <Button class="mt-4" @click="notification.info('Role assignment controls coming soon!')">Manage Roles</Button>
      </Card>

      <!-- Platform Settings Page -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Platform Settings</h3>
        <EmptyState title="Configure Settings" message="Adjust platform-wide settings." />
        <Button class="mt-4" @click="notification.info('Platform settings page coming soon!')">Go to Settings</Button>
      </Card>

      <!-- System Analytics -->
      <Card>
        <h3 class="font-semibold text-xl text-gray-700 mb-4">System Analytics</h3>
        <EmptyState title="View Analytics" message="Monitor platform performance and usage." />
        <Button class="mt-4" @click="notification.info('System analytics page coming soon!')">View Analytics</Button>
      </Card>

      <!-- Audit Logs Viewer -->
      <Card class="lg:col-span-2">
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Audit Logs</h3>
        <EmptyState title="No Recent Logs" message="Track system activities and changes." />
        <Button class="mt-4" @click="notification.info('Audit logs viewer coming soon!')">View All Logs</Button>
      </Card>

      <!-- Batch Operations -->
      <Card class="lg:col-span-2">
        <h3 class="font-semibold text-xl text-gray-700 mb-4">Batch Operations</h3>
        <EmptyState title="No Batch Operations" message="Perform bulk actions on users, courses, etc." />
        <Button class="mt-4" @click="notification.info('Batch operations coming soon!')">Run Batch Operation</Button>
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