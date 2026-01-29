<template>
  <Card class="p-4 flex items-center justify-between hover:shadow-soft-sm">
    <div>
      <p class="text-sm text-gray-500">Total Points</p>
      <p class="text-2xl font-bold text-primary">{{ gameStore.points }}</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-500">Level</p>
      <p class="text-2xl font-bold text-accent">{{ gameStore.level }}</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game';
import Card from '@/components/common/Card.vue';

const gameStore = useGameStore();
</script>