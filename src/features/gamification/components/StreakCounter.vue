<template>
  <Card class="p-4 flex items-center justify-between hover:shadow-soft-sm">
    <div class="flex items-center space-x-2">
      <span class="text-3xl">🔥</span>
      <div>
        <p class="text-sm text-gray-500">Current Streak</p>
        <p class="text-2xl font-bold text-warning">{{ gameStore.streak }} {{ gameStore.streak === 1 ? 'Day' : 'Days' }}</p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game';
import Card from '@/components/common/Card.vue';

const gameStore = useGameStore();
</script>