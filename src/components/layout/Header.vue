<template>
  <header class="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
    <div class="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
      <!-- Logo -->
      <div class="flex items-center space-x-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
          <span class="text-2xl font-bold text-white">Q</span>
        </div>
        <span class="text-xl font-bold tracking-tight text-gray-900">QuizSphere</span>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-8">
        <router-link 
          v-for="item in navItems" 
          :key="item.name" 
          :to="item.to"
          class="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
          :class="{'text-blue-600': $route.path.startsWith(item.to)}"
        >
          {{ item.name }}
        </router-link>
      </nav>

      <!-- Right Side Actions -->
      <div class="flex items-center space-x-4">
        <!-- Theme Toggle -->
        <button 
          @click="toggleTheme"
          class="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          aria-label="Toggle theme"
        >
          <svg v-if="isDark" class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
          </svg>
          <svg v-else class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
          </svg>
        </button>

        <!-- Notifications -->
        <button 
          @click="toggleNotifications"
          class="relative rounded-lg p-2 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <span v-if="unreadCount" class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {{ unreadCount }}
          </span>
        </button>

        <!-- User Menu -->
        <div class="relative">
          <button 
            @click="toggleUserMenu"
            class="flex items-center space-x-3 rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {{ userInitials }}
            </div>
            <div class="hidden md:block text-left">
              <p class="text-sm font-medium text-gray-900">{{ user?.name }}</p>
              <p class="text-xs text-gray-500">{{ user?.role }}</p>
            </div>
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="isUserMenuOpen" class="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border py-1 z-50">
            <router-link 
              to="/profile"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="isUserMenuOpen = false"
            >
              Profile
            </router-link>
            <router-link 
              to="/settings"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="isUserMenuOpen = false"
            >
              Settings
            </router-link>
            <div class="border-t my-1"></div>
            <button 
              @click="logout"
              class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useTheme } from '@/composables/useTheme';
import { useNotification } from '@/composables/useNotification';

const { user, logout } = useAuth();
const { theme, isDark, toggleTheme } = useTheme(); // FIXED: Remove duplicate declaration
const { unreadCount } = useNotification();

const isUserMenuOpen = ref(false);
const isNotificationsOpen = ref(false);

const userInitials = computed(() => {
  if (!user.value?.name) return 'U';
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

// REMOVED: Duplicate isDark declaration

const navItems = [
  { name: 'Dashboard', to: '/' },
  { name: 'Courses', to: '/courses' },
  { name: 'Quizzes', to: '/quizzes' },
  { name: 'Leaderboard', to: '/leaderboard' },
  { name: 'AI Chat', to: '/chat' },
];

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
  isNotificationsOpen.value = false;
};

const toggleNotifications = () => {
  isNotificationsOpen.value = !isNotificationsOpen.value;
  isUserMenuOpen.value = false;
};

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    isUserMenuOpen.value = false;
    isNotificationsOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.router-link-exact-active {
  @apply text-blue-600 font-semibold;
}
</style>