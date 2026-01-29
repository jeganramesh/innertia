import api from './api';

const profileService = {
  async fetchProfile(userId: string) {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

  async updateProfile(userId: string, profileData: any) {
    const response = await api.put(`/users/${userId}/profile`, profileData);
    return response.data;
  },
};

export default profileService;
