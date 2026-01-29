```
/data/data/com.termux/files/home/quizsphere-website/
├───.env.example
├───.env.production
├───.gitignore
├───index.html
├───jsconfig.json
├───package-lock.json
├───package.json
├───postcss.config.js
├───README.md
├───tailwind.config.js
├───Todo.md
├───tsconfig.json
├───vite.config.js
├───vitest.config.ts
├───.vscode/
│   ├───extensions.json
│   └───settings.json
├───node_modules/...
├───public/
│   └───favicon.ico
└───src/
    ├───App.vue
    ├───main.js
    ├───assets/
    │   └───styles/
    │       └───main.css
    ├───components/
    │   ├───chat/
    │   │   ├───ChatContainer.vue
    │   │   ├───ChatHeader.vue
    │   │   ├───ChatInput.vue
    │   │   ├───MessageBubble.vue
    │   │   ├───MessageList.vue
    │   │   ├───SuggestedPrompts.vue
    │   │   └───TypingIndicator.vue
    │   ├───common/
    │   │   ├───Badge.vue
    │   │   ├───Breadcrumb.vue
    │   │   ├───Button.vue
    │   │   ├───Card.vue
    │   │   ├───ConfirmDialog.vue
    │   │   ├───Dropdown.vue
    │   │   ├───EmptyState.vue
    │   │   ├───Input.vue
    │   │   ├───Modal.vue
    │   │   ├───ProgressBar.vue
    │   │   ├───Spinner.vue
    │   │   ├───Tabs.vue
    │   │   ├───Toast.vue
    │   │   └───Tooltip.vue
    │   ├───course/
    │   │   ├───CourseCard.vue
    │   │   ├───CourseHeader.vue
    │   │   ├───LessonPlayer.vue
    │   │   └───LessonSidebar.vue
    │   ├───forms/
    │   │   ├───ClassForm.vue
    │   │   ├───LessonForm.vue
    │   │   ├───QuestionBuilder.vue
    │   │   └───QuizForm.vue
    │   ├───gamification/
    │   │   ├───AchievementUnlock.vue
    │   │   ├───BadgeShowcase.vue
    │   │   ├───LeaderboardCard.vue
    │   │   ├───LevelProgress.vue
    │   │   ├───PointsDisplay.vue
    │   │   ├───StatsCard.vue
    │   │   └───StreakCounter.vue
    │   ├───layout/
    │   │   ├───Header.vue
    │   │   ├───MobileNav.vue
    │   │   ├───Navigation.vue
    │   │   └───Sidebar.vue
    │   ├───profile/
    │   │   └───ProfileHeader.vue
    │   └───quiz/
    │       ├───AnswerOption.vue
    │       ├───QuestionCard.vue
    │       ├───QuestionReview.vue
    │       ├───QuizProgress.vue
    │       ├───ResultsBreakdown.vue
    │       └───TimerDisplay.vue
    ├───composables/
    │   ├───useAuth.ts
    │   ├───useDebounce.ts
    │   ├───useFetch.ts
    │   ├───useForm.ts
    │   ├───useLocalStorage.ts
    │   ├───useMediaQuery.ts
    │   ├───useNotification.ts
    │   └───useTimer.ts
    ├───directives/
    │   ├───v-click-outside.ts
    │   └───v-lazy-load.ts
    ├───router/
    │   └───index.ts
    ├───services/
    │   ├───analyticsService.ts
    │   ├───api.ts
    │   ├───authService.ts
    │   ├───courseService.ts
    │   ├───gamificationService.ts
    │   ├───leaderboardService.ts
    │   ├───profileService.ts
    │   └───quizService.ts
    ├───stores/
    │   ├───auth.ts
    │   ├───game.ts
    │   ├───theme.ts
    │   └───ui.ts
    └───views/
        ├───HomeView.vue
        ├───NotFoundView.vue
        ├───admin/
        │   └───DashboardView.vue
        ├───auth/
        │   └───LoginView.vue
        ├───student/
        │   ├───AIChatView.vue
        │   ├───CourseDetailView.vue
        │   ├───CoursesView.vue
        │   ├───DashboardView.vue
        │   ├───LeaderboardView.vue
        │   ├───LessonView.vue
        │   ├───ProfileView.vue
        │   ├───QuizPlayView.vue
        │   └───QuizResultsView.vue
        └───teacher/
            ├───ClassAnalyticsView.vue
            ├───CreateLessonView.vue
            ├───CreateQuizView.vue
            ├───DashboardView.vue
            └───ManageClassView.vue
```