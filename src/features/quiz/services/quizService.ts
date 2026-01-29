import api from './api';

export const quizService = {
  async fetchQuizzes() {
    const response = await api.get('/quizzes');
    return response.data;
  },

  async fetchQuizById(quizId: string) {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  },

  async submitQuiz(quizId: string, answers: any) {
    const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
    return response.data;
  },

  async getQuizResults(resultId: string) {
    const response = await api.get(`/quiz-results/${resultId}`);
    return response.data;
  },
};