<template>
  <div class="lg:hidden">
    <!-- Mobile Header -->
    <div class="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4">
      <button @click="toggleSidebar" class="p-2">
        <svg class="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="isOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div class="flex items-center space-x-2">
        <div class="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span class="text-lg font-bold text-white">Q</span>
        </div>
        <span class="font-bold text-gray-900">QuizSphere</span>
      </div>
      
      <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
        {{ userInitials }}
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
      @click="closeSidebar"
    ></div>

    <!-- Mobile Sidebar -->
    <transition
      enter-active-class="transform transition-transform duration-300 ease-in-out"
      leave-active-class="transform transition-transform duration-300 ease-in-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside 
        v-if="isOpen"
        class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl"
      >
        <div class="flex flex-col h-full">
          <!-- User Info -->
          <div class="p-6 border-b">
            <div class="flex items-center space-x-3 mb-4">
              <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {{ userInitials }}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{ user?.name }}</h3>
                <p class="text-xs text-gray-500">Level {{ userLevel }}</p>
              </div>
            </div>
            
            <div class="flex space-x-4">
              <div class="text-center">
                <p class="text-xl font-bold text-gray-900">{{ points }}</p>
                <p class="text-xs text-gray-600">Points</p>
              </div>
              <div class="text-center">
                <p class="text-xl font-bold text-gray-900">{{ streak }}</p>
                <p class="text-xs text-gray-600">Streak</p>
              </div>
              <div class="text-center">
                <p class="text-xl font-bold text-gray-900">{{ badges }}</p>
                <p class="text-xs text-gray-600">Badges</p>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 overflow-y-auto p-4">
            <div class="space-y-1">
              <router-link
                v-for="item in navItems"
                :key="item.name"
                :to="item.to"
                @click="closeSidebar"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200"
                :class="[
                  $route.path === item.to 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                ]"
              >
                <component :is="item.icon" class="h-5 w-5" />
                <span class="font-medium">{{ item.name }}</span>
                <span v-if="item.badge" class="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {{ item.badge }}
                </span>
              </router-link>
            </div>
          </nav>

          <!-- Bottom Actions -->
          <div class="border-t p-4 space-y-2">
            <!--
            <button 
              @click="toggleTheme"
              class="flex w-full items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <svg v-if="isDark" class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
                <svg v-else class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
                </svg>
                <span>Theme</span>
              </div>
              <span class="text-sm text-gray-500">{{ isDark ? 'Dark' : 'Light' }}</span>
            </button>
            -->
            
            <button 
              @click="logout"
              class="flex w-full items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
// import { useTheme } from '@/composables/useTheme';
import { useGame } from '@/features/gamification/composables/useGame';
import { 
  HomeIcon, 
  BookOpenIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon
} from '@heroicons/vue/24/outline';

const { user, logout } = useAuth();
// const { theme, toggleTheme } = useTheme();
const { points, streak, level, badges } = useGame();

const isOpen = ref(false);

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
// const isDark = computed(() => theme.value === 'dark');

const navItems = [
  { name: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'Courses', to: '/courses', icon: BookOpenIcon, badge: '5' },
  { name: 'Quizzes', to: '/quizzes', icon: TrophyIcon, badge: '3' },
  { name: 'AI Tutor', to: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Leaderboard', to: '/leaderboard', icon: PresentationChartLineIcon },
  { name: 'Profile', to: '/profile', icon: UserIcon },
  { name: 'Settings', to: '/settings', icon: Cog6ToothIcon },
];

const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};

const closeSidebar = () => {
  isOpen.value = false;
};
</script>