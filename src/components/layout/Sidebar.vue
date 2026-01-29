<template>
  <aside class="hidden lg:flex flex-col w-64 border-r bg-white h-full">
    <!-- Logo Section -->
    <div class="p-6 border-b">
      <div class="flex items-center space-x-3">
        <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span class="text-2xl font-bold text-white">Q</span>
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900">QuizSphere</h1>
          <p class="text-xs text-gray-500">Learn & Compete</p>
        </div>
      </div>
    </div>

    <!-- User Stats -->
    <div class="p-6 border-b">
      <div class="flex items-center space-x-3 mb-4">
        <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
          {{ userInitials }}
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">{{ user?.name }}</h3>
          <p class="text-xs text-gray-500 flex items-center">
            <span class="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
            Level {{ userLevel }}
          </p>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex justify-between text-xs">
          <span class="text-gray-600">Level Progress</span>
          <span class="font-semibold">{{ progress }}%</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            class="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-2">
      <div v-for="group in navGroups" :key="group.title" class="mb-6">
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">{{ group.title }}</h4>
        <div class="space-y-1">
          <router-link
            v-for="item in group.items"
            :key="item.name"
            :to="item.to"
            class="flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group"
            :class="[
              $route.path === item.to 
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <div class="h-6 w-6 flex items-center justify-center">
              <component :is="item.icon" class="h-5 w-5" />
            </div>
            <span class="font-medium">{{ item.name }}</span>
            <span v-if="item.badge" class="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
              {{ item.badge }}
            </span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Quick Stats -->
    <div class="p-6 border-t bg-gradient-to-r from-blue-50 to-purple-50">
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats.points }}</p>
          <p class="text-xs text-gray-600">Points</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats.streak }}</p>
          <p class="text-xs text-gray-600">Day Streak</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth';

import { 
  HomeIcon, 
  BookOpenIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
  UsersIcon
} from '@heroicons/vue/24/outline';

const { user } = useAuth();
const points = ref(1250);
const streak = ref(7);
const level = ref(8);
const badges = ref(12);

const userInitials = computed(() => {
  if (!user.value?.name) return 'U';
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const userLevel = computed(() => level.value || 1);
const progress = computed(() => Math.min(((points.value % 1000) / 10), 100));

const stats = computed(() => ({
  points: points.value || 0,
  streak: streak.value || 0
}));

const navGroups = [
  {
    title: 'Learning',
    items: [
      { name: 'Dashboard', to: '/', icon: HomeIcon },
      { name: 'Courses', to: '/courses', icon: BookOpenIcon, badge: '5' },
      { name: 'Quizzes', to: '/quizzes', icon: TrophyIcon, badge: '3' },
      { name: 'AI Tutor', to: '/chat', icon: ChatBubbleLeftRightIcon },
    ]
  },
  {
    title: 'Community',
    items: [
      { name: 'Leaderboard', to: '/leaderboard', icon: PresentationChartLineIcon },
      { name: 'Classmates', to: '/users', icon: UsersIcon },
    ]
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', to: '/profile', icon: UserIcon },
      { name: 'Settings', to: '/settings', icon: Cog6ToothIcon },
    ]
  }
];
</script>

<style scoped>
.router-link-exact-active {
  @apply bg-blue-50 text-blue-600;
}

.group:hover .group-hover\:text-blue-600 {
  @apply text-blue-600;
}
</style>