<template>
  <Card class="p-4 flex items-center space-x-4 transition-colors hover:shadow-soft-sm" :class="{'bg-primary-50 border-l-4 border-primary': isCurrentUser}">
    <div class="text-xl font-bold text-gray-700 w-8 text-center">{{ rank }}</div>
    <img
      :src="user.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp&s=50'"
      alt="User Avatar"
      class="w-10 h-10 rounded-full object-cover"
    />
    <div class="flex-grow">
      <p class="font-medium text-gray-800">{{ user.name }}</p>
      <p class="text-sm text-gray-500">Level {{ user.level }}</p>
    </div>
    <div class="text-right">
      <p class="text-lg font-bold text-primary">{{ user.points }} pts</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { withDefaults, defineProps } from 'vue';
import Card from '@/components/common/Card.vue';

interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  points: number;
}

const props = withDefaults(defineProps<{
  user: LeaderboardUser;
  rank: number;
  isCurrentUser?: boolean;
}>(), {
  isCurrentUser: false,
});
</script>