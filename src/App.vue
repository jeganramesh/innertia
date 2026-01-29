<template>
  <div id="app" class="min-h-screen bg-gray-100 font-sans antialiased flex">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-0 focus:left-0 focus:bg-white focus:text-black focus:p-3 focus:border focus:border-black">Skip to main content</a>

    <!-- Sidebar for large screens -->
    <Sidebar v-if="isLargeScreen" />

    <div class="flex-1 flex flex-col">
      <!-- Header for large screens, MobileNav toggle for small screens -->
      <Header v-if="isLargeScreen" />
      <div class="md:hidden">
        <MobileNav />
      </div>

      <main id="main-content" class="flex-1 container mx-auto mt-4 p-4">
        <Suspense>
          <router-view />
          <template #fallback>
            <div class="flex justify-center items-center h-64">
              <Spinner size="lg" color="primary" /> <!-- Enhanced loading state -->
            </div>
          </template>
        </Suspense>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Header from '@/components/layout/Header.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import MobileNav from '@/components/layout/MobileNav.vue';
import Spinner from '@/components/common/Spinner.vue';
import { useMediaQuery } from '@/composables/useMediaQuery';

const isLargeScreen = useMediaQuery('(min-width: 768px)');
</script>

<style scoped>
/* You can add global styles or specific styles here */
</style>
