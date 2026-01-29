import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/features/student/views/DashboardView.vue')
  },
  {
    path: '/courses',
    name: 'courses',
    component: () => import('@/features/course/views/CoursesView.vue')
  },
  {
    path: '/courses/:id',
    name: 'course-detail',
    component: () => import('@/features/course/views/CourseDetailView.vue')
  },

  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue')
  },
  {
    path: '/teacher/dashboard',
    name: 'teacher-dashboard',
    component: () => import('@/features/teacher/views/DashboardView.vue')
  },
  {
    path: '/teacher/classes',
    name: 'teacher-manage-class',
    component: () => import('@/features/teacher/views/ManageClassView.vue')
  },
  {
    path: '/teacher/classes/:id/analytics',
    name: 'teacher-class-analytics',
    component: () => import('@/features/teacher/views/ClassAnalyticsView.vue')
  },
  {
    path: '/teacher/lessons/create',
    name: 'teacher-create-lesson',
    component: () => import('@/features/teacher/views/CreateLessonView.vue')
  },
  {
    path: '/teacher/quizzes/create',
    name: 'teacher-create-quiz',
    component: () => import('@/features/teacher/views/CreateQuizView.vue')
  },
  {
    path: '/courses/:id/lesson/:lessonId',
    name: 'lesson',
    component: () => import('@/features/course/views/LessonView.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('@/features/admin/views/DashboardView.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/features/profile/views/ProfileView.vue')
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/features/chat/views/AIChatView.vue')
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('@/features/gamification/views/LeaderboardView.vue')
  },
  {
    path: '/quiz/play',
    name: 'quiz-play',
    component: () => import('@/features/quiz/views/QuizPlayView.vue')
  },
  {
    path: '/quiz/results/:id',
    name: 'quiz-results',
    component: () => import('@/features/quiz/views/QuizResultsView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;