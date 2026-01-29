import { api } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    avatar?: string;
  };
  access_token: string;
  refresh_token: string;
}

export const authService = {
  // Real API calls
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // For real backend
      // return await api.post<AuthResponse>('/auth/login', credentials);
      
      // Mock response for development
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            user: {
              id: '1',
              name: credentials.email.split('@')[0],
              email: credentials.email,
              role: 'student',
              avatar: `https://ui-avatars.com/api/?name=${credentials.email.split('@')[0]}&background=random`
            },
            access_token: 'mock-access-token-' + Date.now(),
            refresh_token: 'mock-refresh-token-' + Date.now()
          });
        }, 1000);
      });
    } catch (error) {
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      // For real backend
      // return await api.post<AuthResponse>('/auth/register', data);
      
      // Mock response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            user: {
              id: '2',
              name: data.name,
              email: data.email,
              role: 'student',
              avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`
            },
            access_token: 'mock-access-token-register-' + Date.now(),
            refresh_token: 'mock-refresh-token-register-' + Date.now()
          });
        }, 1000);
      });
    } catch (error) {
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // For real backend
      // await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      throw error;
    }
  },

  getProfile: async (): Promise<any> => {
    try {
      // For real backend
      // return await api.get('/auth/profile');
      
      // Mock response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'student',
            avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
            points: 1250,
            level: 8,
            streak: 7,
            badges: 12
          });
        }, 500);
      });
    } catch (error) {
      throw error;
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    try {
      // For real backend
      // return await api.post('/auth/refresh', { refresh_token: refreshToken });
      
      // Mock response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            access_token: 'new-mock-access-token-' + Date.now()
          });
        }, 500);
      });
    } catch (error) {
      throw error;
    }
  }
};