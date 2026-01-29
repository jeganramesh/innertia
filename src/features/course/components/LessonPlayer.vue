<template>
  <div class="bg-black rounded-lg overflow-hidden relative shadow-soft-lg" :class="{'aspect-video': mediaType === 'video'}">
    <!-- Video Player Placeholder -->
    <div v-if="mediaType === 'video'" class="w-full h-full flex items-center justify-center text-white text-xl">
      <video controls class="w-full h-full object-contain" title="Lesson video player">
        <source :src="mediaSrc" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>

    <!-- Document Viewer Placeholder -->
    <div v-else-if="mediaType === 'document'" class="w-full h-96 flex items-center justify-center bg-gray-200">
      <iframe :src="mediaSrc" class="w-full h-full border-0" title="Lesson document viewer"></iframe>
    </div>

    <!-- Generic Content Placeholder -->
    <div v-else class="w-full h-96 flex items-center justify-center bg-gray-200 text-gray-700">
      <p>Unsupported media type or no media provided.</p>
    </div>

    <!-- Fullscreen Button (example) -->
    <button v-if="mediaType === 'video'" @click="toggleFullscreen" class="absolute bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full opacity-75 hover:opacity-100 transition-opacity" aria-label="Toggle fullscreen">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5"></path></svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, withDefaults } from 'vue';

type MediaType = 'video' | 'document' | 'text'; // Add more as needed

const props = withDefaults(defineProps<{
  mediaType: MediaType;
  mediaSrc: string;
}>(), {
  mediaType: 'video',
  mediaSrc: '',
});

const toggleFullscreen = () => {
  const videoElement = document.querySelector('video'); // This is a simplistic way, improve for production
  if (videoElement) {
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if ((videoElement as any).mozRequestFullScreen) { /* Firefox */
      (videoElement as any).mozRequestFullScreen();
    } else if ((videoElement as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      (videoElement as any).webkitRequestFullscreen();
    } else if ((videoElement as any).msRequestFullscreen) { /* IE/Edge */
      (videoElement as any).msRequestFullscreen();
    }
  }
};
</script>