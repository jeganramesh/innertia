import api from './api';

const gamificationService = {
  async fetchUserPoints(userId: string) {
    const response = await api.get(`/users/${userId}/points`);
    return response.data;
  },

  async fetchUserBadges(userId: string) {
    const response = await api.get(`/users/${userId}/badges`);
    return response.data;
  },

  async awardPoints(userId: string, amount: number, reason: string) {
    const response = await api.post(`/users/${userId}/points`, { amount, reason });
    return response.data;
  },

  async awardBadge(userId: string, badgeId: string) {
    const response = await api.post(`/users/${userId}/badges`, { badgeId });
    return response.data;
  },
};

export default gamificationService;
