<template>
  <Card class="p-4">
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm text-gray-700 font-medium">Level {{ gameStore.level }}</p>
      <p class="text-xs text-gray-500">{{ gameStore.xp }} / {{ gameStore.nextLevelThreshold }} XP</p>
    </div>
    <ProgressBar :percentage="progressPercentage" color="info" />
    <p class="text-xs text-gray-500 mt-2">Next level in {{ gameStore.nextLevelThreshold - gameStore.xp }} XP</p>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';
import Card from '@/components/common/Card.vue';
import ProgressBar from '@/components/common/ProgressBar.vue';

const gameStore = useGameStore();

const progressPercentage = computed(() => {
  if (gameStore.nextLevelThreshold === 0) return 0;
  return Math.min(Math.floor((gameStore.xp / gameStore.nextLevelThreshold) * 100), 100);
});
</script>