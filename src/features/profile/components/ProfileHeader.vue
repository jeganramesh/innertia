<template>
  <Card class="p-6 flex items-center space-x-6">
    <div class="flex-shrink-0">
      <img
        :src="avatarUrl || 'https://www.gravatar.com/avatar/?d=mp&s=100'"
        alt="User Avatar"
        class="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
      />
    </div>
    <div>
      <h1 class="text-3xl font-bold text-gray-900">{{ userName }}</h1>
      <div class="flex items-center mt-1">
        <Badge variant="primary" class="mr-2">{{ userRole }}</Badge>
        <span class="text-gray-600">{{ userEmail }}</span>
      </div>
      <div class="mt-3">
        <Button size="sm" variant="secondary" @click="emit('editProfile')">Edit Profile</Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, defineEmits } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';

const props = withDefaults(defineProps<{
  userName: string;
  userEmail: string;
  userRole: string;
  avatarUrl?: string;
}>(), {
  avatarUrl: '',
});

const emit = defineEmits(['editProfile']);
</script>