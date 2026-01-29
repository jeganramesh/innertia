<template>
  <div class="p-4 sm:p-6">
    <!-- Welcome Banner -->
    <div class="mb-8 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg">
      <div class="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold mb-2">Welcome back, {{ user?.name }}! 👋</h1>
          <p class="text-blue-100 opacity-90">Your learning journey continues. Ready for today's challenge?</p>
        </div>
        <div class="mt-4 md:mt-0">
          <Button 
            @click="startDailyChallenge" 
            size="lg"
            class="bg-white text-blue-600 hover:bg-gray-100"
          >
            <TrophyIcon class="h-5 w-5 mr-2" />
            Start Daily Challenge
          </Button>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Points"
        :value="stats.points"
        icon="🏆"
        color="from-yellow-400 to-orange-500"
        trend="+12%"
      />
      <StatCard
        title="Current Streak"
        :value="stats.streak + ' days'"
        icon="🔥"
        color="from-red-500 to-pink-600"
        trend="+3"
      />
      <StatCard
        title="Level"
        :value="stats.level"
        icon="⭐"
        color="from-blue-400 to-cyan-500"
        :progress="stats.levelProgress"
      />
      <StatCard
        title="Accuracy"
        :value="stats.accuracy + '%'"
        icon="🎯"
        color="from-green-500 to-emerald-600"
        trend="+5%"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Recent Activity -->
        <Card title="Recent Activity" class="h-full">
          <div class="space-y-4">
        <!--
            <ActivityItem
              v-for="activity in recentActivities"
              :key="activity.id"
              :activity="activity"
            />
          -->
          </div>
          <template #footer>
            <Button variant="ghost" class="w-full" @click="$router.push('/activity')">
              View All Activity
            </Button>
          </template>
        </Card>

        <!-- Recommended Courses -->
        <Card title="Recommended For You">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CourseCard
              v-for="course in recommendedCourses"
              :key="course.id"
              :course="course"
            />
          </div>
        </Card>
      </div>

      <!-- Right Column -->
      <div class="space-y-6">
        <!-- Upcoming Quizzes -->
        <Card title="Upcoming Quizzes">
          <div class="space-y-3">
            <!--
            <QuizItem
              v-for="quiz in upcomingQuizzes"
              :key="quiz.id"
              :quiz="quiz"
            />
          -->
          </div>
        </Card>

        <!-- Achievement Progress -->
        <Card title="Achievements Progress">
          <div class="space-y-4">
            <!--
            <AchievementProgress
              v-for="achievement in achievements"
              :key="achievement.id"
              :achievement="achievement"
            />
          -->
          </div>
        </Card>

        <!-- Quick Actions -->
        <Card title="Quick Actions">
          <div class="grid grid-cols-2 gap-3">
            <Button 
              @click="$router.push('/courses')" 
              variant="ghost"
              class="flex-col h-auto py-3"
            >
              <BookOpenIcon class="h-6 w-6 mb-2 text-blue-600" />
              <span class="text-sm">Browse Courses</span>
            </Button>
            <Button 
              @click="$router.push('/quizzes')" 
              variant="ghost"
              class="flex-col h-auto py-3"
            >
              <TrophyIcon class="h-6 w-6 mb-2 text-green-600" />
              <span class="text-sm">Take Quiz</span>
            </Button>
            <Button 
              @click="$router.push('/leaderboard')" 
              variant="ghost"
              class="flex-col h-auto py-3"
            >
              <ChartBarIcon class="h-6 w-6 mb-2 text-purple-600" />
              <span class="text-sm">Leaderboard</span>
            </Button>
            <Button 
              @click="$router.push('/chat')" 
              variant="ghost"
              class="flex-col h-auto py-3"
            >
              <ChatBubbleLeftRightIcon class="h-6 w-6 mb-2 text-pink-600" />
              <span class="text-sm">AI Tutor</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useGame } from '@/features/gamification/composables/useGame';
import { useNotification } from '@/composables/useNotification';
import { TrophyIcon, BookOpenIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline';
import Button from '@/components/common/Button.vue';
import Card from '@/components/common/Card.vue';
import StatCard from '@/features/gamification/components/StatsCard.vue';
// import ActivityItem from '@/features/gamification/components/ActivityItem.vue';
import CourseCard from '@/features/course/components/CourseCard.vue';
// import QuizItem from '@/features/quiz/components/QuizItem.vue';
// import AchievementProgress from '@/features/gamification/components/AchievementProgress.vue';

const { user } = useAuth();
const { points, streak, level, badges } = useGame();
const notification = useNotification();

const stats = computed(() => ({
  points: points.value || 1250,
  streak: streak.value || 7,
  level: level.value || 8,
  levelProgress: 65,
  accuracy: 87
}));

const recentActivities = ref([
  {
    id: 1,
    type: 'quiz_complete',
    title: 'Advanced JavaScript Quiz',
    description: 'Scored 95%',
    points: 150,
    time: '2 hours ago',
    icon: '🎯'
  },
  {
    id: 2,
    type: 'badge_earned',
    title: 'Quiz Master Badge',
    description: 'Completed 10 quizzes',
    points: 200,
    time: '1 day ago',
    icon: '🏆'
  },
  {
    id: 3,
    type: 'lesson_complete',
    title: 'Vue 3 Fundamentals',
    description: 'Finished lesson 5',
    points: 75,
    time: '2 days ago',
    icon: '📚'
  }
]);

const recommendedCourses = ref([
  {
    id: 1,
    title: 'Advanced TypeScript',
    description: 'Master advanced TS concepts',
    progress: 30,
    lessons: 12,
    level: 'Advanced',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    title: 'Vue 3 Masterclass',
    description: 'Build real-world applications',
    progress: 0,
    lessons: 15,
    level: 'Intermediate',
    color: 'from-green-500 to-emerald-600'
  }
]);

const upcomingQuizzes = ref([
  {
    id: 1,
    title: 'React Hooks Quiz',
    dueDate: 'Tomorrow',
    duration: '30 min',
    questions: 20,
    difficulty: 'Medium'
  },
  {
    id: 2,
    title: 'Node.js Fundamentals',
    dueDate: 'In 3 days',
    duration: '45 min',
    questions: 25,
    difficulty: 'Hard'
  }
]);

const achievements = ref([
  {
    id: 1,
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    progress: 0,
    total: 1,
    icon: '💯'
  },
  {
    id: 2,
    title: '7-Day Streak',
    description: 'Learn for 7 consecutive days',
    progress: 7,
    total: 7,
    icon: '🔥'
  },
  {
    id: 3,
    title: 'Social Learner',
    description: 'Share 5 quiz results',
    progress: 2,
    total: 5,
    icon: '👥'
  }
]);

const startDailyChallenge = () => {
  notification.success('Starting your daily challenge!');
  // Navigate to daily challenge
};
</script>