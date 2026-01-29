<template>
  <Card class="p-6">
    <h3 class="text-xl font-bold text-gray-800 mb-4">Earned Badges</h3>
    <div v-if="gameStore.badges.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="badge in gameStore.badges" :key="badge.id" class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg shadow-soft-sm hover:scale-105 transition-transform">
        <span class="text-4xl mb-2">{{ badge.icon }}</span>
        <Tooltip :content="badge.description">
          <p class="font-medium text-gray-800">{{ badge.name }}</p>
        </Tooltip>
        <p class="text-xs text-gray-500 mt-1">Earned: {{ new Date(badge.earnedDate).toLocaleDateString() }}</p>
      </div>
    </div>
    <EmptyState v-else title="No Badges Yet" message="Keep learning and completing challenges to earn badges!" icon="🏅" />
  </Card>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game';
import Card from '@/components/common/Card.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Tooltip from '@/components/common/Tooltip.vue';

const gameStore = useGameStore();
</script>