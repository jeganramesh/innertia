/**
 * Central Authentication Service
 * Handles login, logout, token refresh, and user management
 * Follows the backend /account/* route namespace
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';
const ACCOUNTS_PREFIX = '/accounts';  // Backend uses /accounts (plural)

// Types

export interface LoginInput {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  role: 'student' | 'faculty' | 'admin';
  is_active: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Create axios instance for account API
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_V1_PREFIX}${ACCOUNTS_PREFIX}`,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,  // Set to false when using wildcard CORS origins
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor - handle 401 and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle 401 - try to refresh token
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(
              `${API_BASE_URL}${API_V1_PREFIX}/account/refresh`,
              { refresh_token: refreshToken }
            );

            const { access_token, refresh_token: newRefreshToken } = response.data;

            // Store new tokens
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', newRefreshToken);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          clearAuthData();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const api = createApiClient();

// Clear all auth data
const clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
};

// Test credentials for development
const TEST_CREDENTIALS = {
  student: { email: 'student@test.com', password: 'student123', role: 'student' as const, full_name: 'Test Student' },
  faculty: { email: 'faculty@test.com', password: 'faculty123', role: 'faculty' as const, full_name: 'Test Faculty' },
  admin: { email: 'admin@test.com', password: 'admin123', role: 'admin' as const, full_name: 'Test Admin' }
};

// Auth Service
export const authService = {
  /**
   * Login user with email and password
   * Uses real backend API for authentication
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    console.log('Login attempt:', { email: data.email, isDev: import.meta.env.DEV, mode: import.meta.env.MODE });
    
    // Check for test credentials - use REAL backend API for authentication
    const isTestCredentials =
      (data.email === TEST_CREDENTIALS.student.email && data.password === TEST_CREDENTIALS.student.password) ||
      (data.email === TEST_CREDENTIALS.faculty.email && data.password === TEST_CREDENTIALS.faculty.password) ||
      (data.email === TEST_CREDENTIALS.admin.email && data.password === TEST_CREDENTIALS.admin.password);
    
    // ALWAYS call real API for authentication (never use mock tokens)
    // This ensures we get valid JWT tokens that the backend can validate
    try {
      const response = await api.post<AuthTokens>('/login', data);
      const { access_token, refresh_token, token_type } = response.data;

      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('token_type', token_type);

      // Get user info
      const userResponse = await api.get<User>('/me');
      const user = userResponse.data;

      return {
        user,
        tokens: { access_token, refresh_token, token_type }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      // Provide more helpful error message
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 403) {
        throw new Error('Account is inactive or not verified');
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  /**
   * Create mock response for development
   */
  createMockResponse(credentials: { email: string; password: string; role: 'student' | 'faculty' | 'admin'; full_name: string }): AuthResponse {
    const mockToken = `mock-${credentials.role}-token-${Date.now()}`;
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: credentials.email,
      full_name: credentials.full_name,
      name: credentials.full_name,
      role: credentials.role,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('refresh_token', mockToken);
    localStorage.setItem('token_type', 'bearer');
    localStorage.setItem('user', JSON.stringify(mockUser));

    return {
      user: mockUser,
      tokens: { access_token: mockToken, refresh_token: mockToken, token_type: 'bearer' }
    };
  },

  /**
   * Logout user - clears tokens
   */
  async logout(): Promise<void> {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  },

  /**
   * Get current user from API
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/me');
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<AuthTokens>('/refresh', { refresh_token });
    const { access_token, refresh_token: newRefreshToken, token_type } = response.data;

    // Store new tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', newRefreshToken);
    localStorage.setItem('token_type', token_type);

    return { access_token, refresh_token: newRefreshToken, token_type };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Store user data
   */
  storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Get role-based redirect path
   */
  getRoleBasedRoute(role: string): string {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'faculty':
        return '/faculty/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  }
};

export default authService;
