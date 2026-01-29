<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Leaderboard</h1>

    <!-- Filter and Search -->
    <div class="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
      <Dropdown
        :options="leaderboardTypeOptions"
        v-model="selectedLeaderboardType"
        placeholder="Select Leaderboard Type"
        class="w-full md:w-auto"
      />
      <Input
        v-model="searchQuery"
        placeholder="Search student..."
        type="search"
        class="flex-grow"
      />
      <!-- More filters for subject, institution etc. -->
      <Button @click="applyFilters" class="w-full md:w-auto">Apply Filters</Button>
      <Button variant="ghost" @click="resetFilters" class="w-full md:w-auto">Reset</Button>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
    <div v-else-if="error" class="text-center text-error-600 p-4">
      <EmptyState title="Error Loading Leaderboard" :message="error.message || 'Failed to fetch leaderboard data.'" icon="⚠️" />
    </div>
    <div v-else-if="leaderboard.length > 0" class="space-y-4">
      <LeaderboardCard
        v-for="(user, index) in leaderboard"
        :key="user.id"
        :user="user"
        :rank="index + 1"
        :is-current-user="user.id === 'current-user-id'"
      />
    </div>
    <div v-else class="text-center p-8">
      <EmptyState title="No Rankings Yet" message="Be the first to get on the leaderboard!" icon="📊" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useFetch } from '@/composables/useFetch';
import { useDebounce } from '@/composables/useDebounce';
import LeaderboardCard from "@/features/gamification/components/LeaderboardCard.vue";
import Card from '@/components/common/Card.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';

interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  points: number;
}

const leaderboard = ref<LeaderboardUser[]>([]);
const searchQuery = ref('');
const debouncedSearchQuery = useDebounce(searchQuery, 300);

const selectedLeaderboardType = ref('global'); // Default to global
const leaderboardTypeOptions = [
  { label: 'Global', value: 'global' },
  { label: 'Class', value: 'class' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'All-Time', value: 'all-time' },
];

const fetchUrl = computed(() => {
  const params = new URLSearchParams();
  if (debouncedSearchQuery.value) {
    params.append('search', debouncedSearchQuery.value as string);
  }
  // Add other filters as needed
  return `/leaderboard/${selectedLeaderboardType.value}?${params.toString()}`;
});

const { data, loading, error, execute } = useFetch<LeaderboardUser[]>(fetchUrl);

watch(data, (newLeaderboard) => {
  if (newLeaderboard) {
    leaderboard.value = newLeaderboard;
  }
});

watch([selectedLeaderboardType, debouncedSearchQuery], () => {
  execute();
});

const applyFilters = () => {
  execute();
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedLeaderboardType.value = 'global';
};
</script>