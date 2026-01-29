import api from './api';

const leaderboardService = {
  async fetchGlobalLeaderboard() {
    const response = await api.get('/leaderboard/global');
    return response.data;
  },

  async fetchClassLeaderboard(classId: string) {
    const response = await api.get(`/leaderboard/class/${classId}`);
    return response.data;
  },

  async fetchWeeklyLeaderboard() {
    const response = await api.get('/leaderboard/weekly');
    return response.data;
  },

  async fetchMonthlyLeaderboard() {
    const response = await api.get('/leaderboard/monthly');
    return response.data;
  },
};

export default leaderboardService;
