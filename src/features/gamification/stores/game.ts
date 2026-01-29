import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useGameStore = defineStore('game', () => {
  const points = ref(1250);
  const streak = ref(7);
  const level = ref(8);
  const badges = ref<string[]>(['quiz-master', 'fast-learner', 'streak-champion']);
  const achievements = ref<string[]>([]);
  
  const levelProgress = computed(() => {
    return (points.value % 1000) / 10;
  });
  
  const nextLevelThreshold = computed(() => {
    return (level.value + 1) * 1000 - points.value;
  });
  
  const earnedBadges = computed(() => badges.value);
  
  const updatePoints = (amount: number) => {
    points.value += amount;
    if (points.value >= level.value * 1000) {
      level.value = Math.floor(points.value / 1000);
    }
  };
  
  const unlockBadge = (badgeId: string) => {
    if (!badges.value.includes(badgeId)) {
      badges.value.push(badgeId);
    }
  };
  
  const updateStreak = (increment: boolean = true) => {
    if (increment) {
      streak.value += 1;
    } else {
      streak.value = 0;
    }
  };
  
  const addAchievement = (achievementId: string) => {
    if (!achievements.value.includes(achievementId)) {
      achievements.value.push(achievementId);
    }
  };
  
  return {
    points,
    streak,
    level,
    badges,
    achievements,
    levelProgress,
    nextLevelThreshold,
    earnedBadges,
    updatePoints,
    unlockBadge,
    updateStreak,
    addAchievement,
  };
});