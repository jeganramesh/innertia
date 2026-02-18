/**
 * Account API Service
 * Handles authentication-related API calls
 * Maps to backend /account/* routes
 */

import axios, { AxiosInstance } from 'axios';
import type { User } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Create axios instance with interceptors
const createAccountApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor - handle 401
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const accountApi = createAccountApiClient();

// Response types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  role?: 'student' | 'faculty' | 'admin';
}

// Account API Service
export const accountApiService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await accountApi.post<LoginResponse>('/account/login', { email, password });
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await accountApi.post<User>('/account/register', data);
    return response.data;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await accountApi.post('/account/logout');
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await accountApi.post<RefreshResponse>('/account/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await accountApi.get<User>('/account/me');
    return response.data;
  },

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<{ valid: boolean }> {
    const response = await accountApi.get<{ valid: boolean }>('/account/verify');
    return response.data;
  }
};

export default accountApiService;
