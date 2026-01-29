import { ref, computed } from 'vue';

export const useGame = () => {
  const points = ref(1250);
  const streak = ref(7);
  const level = ref(8);
  const badges = ref(12);
  const achievements = ref<string[]>([]);

  const levelProgress = computed(() => {
    return (points.value % 1000) / 10;
  });

  const nextLevelPoints = computed(() => {
    return (level.value + 1) * 1000 - points.value;
  });

  const addPoints = (amount: number) => {
    points.value += amount;
    // Check for level up
    if (points.value >= level.value * 1000) {
      level.value = Math.floor(points.value / 1000);
    }
  };

  const updateStreak = (increment: boolean) => {
    if (increment) {
      streak.value += 1;
    } else {
      streak.value = 0;
    }
  };

  const addBadge = (badgeId: string) => {
    if (!achievements.value.includes(badgeId)) {
      achievements.value.push(badgeId);
      badges.value += 1;
    }
  };

  return {
    points,
    streak,
    level,
    badges,
    achievements,
    levelProgress,
    nextLevelPoints,
    addPoints,
    updateStreak,
    addBadge,
  };
};