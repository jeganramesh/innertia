<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
    <div v-else-if="error" class="text-center text-error-600 p-4">
      <EmptyState title="Error Loading Profile" :message="error.message || 'Failed to fetch user profile.'" icon="⚠️" />
    </div>
    <div v-else-if="profile">
      <ProfileHeader
        :user-name="profile.name"
        :user-email="profile.email"
        :user-role="profile.role"
        :avatar-url="profile.avatarUrl"
        @editProfile="openEditProfileModal"
        class="mb-6"
      />

      <Tabs :tabs="profileTabs" v-model:modelValue="activeTab" class="mb-6">
        <template #personal-info>
          <Card class="p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-500">Full Name</p>
                <p class="text-gray-800">{{ profile.name }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Email</p>
                <p class="text-gray-800">{{ profile.email }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Date of Birth</p>
                <p class="text-gray-800">{{ profile.dob }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Location</p>
                <p class="text-gray-800">{{ profile.location }}</p>
              </div>
            </div>
          </Card>
        </template>
        <template #academic-info>
          <Card class="p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Academic Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-500">Institution</p>
                <p class="text-gray-800">{{ profile.academic?.institution }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Major</p>
                <p class="text-gray-800">{{ profile.academic?.major }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Graduation Year</p>
                <p class="text-gray-800">{{ profile.academic?.graduationYear }}</p>
              </div>
            </div>
          </Card>
        </template>
        <template #statistics>
          <Card class="p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Statistics</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-500">Quizzes Taken</p>
                <p class="text-gray-800 font-semibold text-lg">{{ profile.stats?.quizzesTaken }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Average Score</p>
                <p class="text-gray-800 font-semibold text-lg">{{ profile.stats?.averageScore }}%</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Current Streak</p>
                <p class="text-gray-800 font-semibold text-lg">{{ profile.stats?.currentStreak }} days</p>
              </div>
            </div>
          </Card>
        </template>
        <template #achievements>
          <Card class="p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Achievements</h2>
            <div v-if="profile.achievements && profile.achievements.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="achievement in profile.achievements" :key="achievement.id" class="text-center p-3 bg-gray-50 rounded-lg">
                <p class="text-4xl mb-2">{{ achievement.icon }}</p>
                <p class="font-medium text-gray-800">{{ achievement.name }}</p>
                <p class="text-xs text-gray-500">{{ achievement.dateEarned }}</p>
              </div>
            </div>
            <EmptyState v-else title="No Achievements" message="Keep learning to unlock new achievements!" icon="🏆" />
          </Card>
        </template>
        <template #settings>
          <Card class="p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Settings & Preferences</h2>
            <p>Theme: Light/Dark Toggle (will be implemented via theme store)</p>
            <p>Notifications: On/Off</p>
            <!-- Actual settings forms will go here -->
          </Card>
        </template>
      </Tabs>
    </div>
    <div v-else class="text-center p-8">
      <EmptyState title="Profile Not Found" message="User profile could not be loaded." icon="👤" />
    </div>

    <!-- Edit Profile Modal -->
    <Modal :is-open="isEditProfileModalOpen" title="Edit Profile" @close="closeEditProfileModal">
      <div class="p-4">
        <p>Edit profile form goes here...</p>
        <div class="mt-4 flex justify-end">
          <Button @click="closeEditProfileModal">Save Changes</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router'; // Assuming current user's profile, route param might not be needed
import { useFetch } from '@/composables/useFetch';
import ProfileHeader from '@/features/profile/components/ProfileHeader.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Spinner from '@/components/common/Spinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Badge from '@/components/common/Badge.vue';
import Tabs from '@/components/common/Tabs.vue';
import Modal from '@/components/common/Modal.vue';
import { useAuth } from '@/composables/useAuth';

// Mock Data Types
interface Achievement {
  id: string;
  name: string;
  icon: string;
  dateEarned: string;
}

interface AcademicInfo {
  institution?: string;
  major?: string;
  graduationYear?: number;
}

interface UserStats {
  quizzesTaken: number;
  averageScore: number;
  currentStreak: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  dob?: string;
  location?: string;
  academic?: AcademicInfo;
  stats?: UserStats;
  achievements?: Achievement[];
}

const route = useRoute();
const { user } = useAuth(); // Get authenticated user

const userId = computed(() => user.value?.id || 'current'); // Use current user ID or a placeholder
const profileUrl = computed(() => `/users/${userId.value}/profile`); // API endpoint for fetching profile

const { data: profile, loading, error, execute } = useFetch<UserProfile>(profileUrl);

const isEditProfileModalOpen = ref(false);
const activeTab = ref('personal-info');

const profileTabs = [
  { label: 'Personal Info', value: 'personal-info' },
  { label: 'Academic Info', value: 'academic-info' },
  { label: 'Statistics', value: 'statistics' },
  { label: 'Achievements', value: 'achievements' },
  { label: 'Settings', value: 'settings' },
];

onMounted(() => {
  if (userId.value) {
    execute(); // Fetch profile details
  }
});

const openEditProfileModal = () => {
  isEditProfileModalOpen.value = true;
};

const closeEditProfileModal = () => {
  isEditProfileModalOpen.value = false;
};
</script>