<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
    <h1 class="text-6xl font-extrabold text-indigo-600">404</h1>
    <p class="text-2xl font-medium mt-4">Page Not Found</p>
    <p class="text-gray-600 mt-2">The page you're looking for doesn't exist or has been moved.</p>
    <router-link to="/" class="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200">
      Go to Home
    </router-link>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
</style>