/**
 * Authentication Service
 * Handles API communication for authentication endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name?: string;
  role?: 'student' | 'faculty' | 'admin';
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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

export interface ErrorResponse {
  detail: string;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Handle 401 errors - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}${API_V1_PREFIX}/accounts/refresh`,
            { refresh_token: refreshToken }
          );
          
          const { access_token, refresh_token } = response.data;
          
          // Store new tokens
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout user (clear localStorage directly)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_type');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Test credentials for development
const TEST_CREDENTIALS = {
  student: { email: 'student@innertia.edu', password: 'studentpass123', role: 'student', full_name: 'Student User' },
  faculty: { email: 'faculty@innertia.edu', password: 'facultypass123', role: 'faculty', full_name: 'Faculty User' },
  admin: { email: 'admin@innertia.edu', password: 'adminpass123', role: 'admin', full_name: 'Admin User' }
};

// Auth Service
export const authService = {
  /**
   * Login user with email and password
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    // Check for test credentials
    if (data.email === TEST_CREDENTIALS.student.email && data.password === TEST_CREDENTIALS.student.password) {
      const mockUser: User = {
        id: '1',
        email: TEST_CREDENTIALS.student.email,
        full_name: TEST_CREDENTIALS.student.full_name,
        role: TEST_CREDENTIALS.student.role,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const mockToken = 'mock-student-token-' + Date.now();
      localStorage.setItem('access_token', mockToken);
      localStorage.setItem('refresh_token', mockToken);
      localStorage.setItem('token_type', 'bearer');
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { user: mockUser, tokens: { access_token: mockToken, refresh_token: mockToken, token_type: 'bearer' } };
    }
    
    if (data.email === TEST_CREDENTIALS.faculty.email && data.password === TEST_CREDENTIALS.faculty.password) {
      const mockUser: User = {
        id: '2',
        email: TEST_CREDENTIALS.faculty.email,
        full_name: TEST_CREDENTIALS.faculty.full_name,
        role: TEST_CREDENTIALS.faculty.role,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const mockToken = 'mock-faculty-token-' + Date.now();
      localStorage.setItem('access_token', mockToken);
      localStorage.setItem('refresh_token', mockToken);
      localStorage.setItem('token_type', 'bearer');
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { user: mockUser, tokens: { access_token: mockToken, refresh_token: mockToken, token_type: 'bearer' } };
    }
    
    if (data.email === TEST_CREDENTIALS.admin.email && data.password === TEST_CREDENTIALS.admin.password) {
      const mockUser: User = {
        id: '3',
        email: TEST_CREDENTIALS.admin.email,
        full_name: TEST_CREDENTIALS.admin.full_name,
        role: TEST_CREDENTIALS.admin.role,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const mockToken = 'mock-admin-token-' + Date.now();
      localStorage.setItem('access_token', mockToken);
      localStorage.setItem('refresh_token', mockToken);
      localStorage.setItem('token_type', 'bearer');
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { user: mockUser, tokens: { access_token: mockToken, refresh_token: mockToken, token_type: 'bearer' } };
    }
    
    try {
      const response = await api.post<AuthTokens>('/accounts/login', data);
      const { access_token, refresh_token, token_type } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('token_type', token_type);
      localStorage.setItem('auth_token', access_token); // Also set for api.ts compatibility
      
      // Get user info
      const userResponse = await api.get<User>('/accounts/me');
      
      return {
        user: userResponse.data,
        tokens: { access_token, refresh_token, token_type }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },
  
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<User> {
    const response = await api.post<User>('/accounts/register', data);
    return response.data;
  },
  
  /**
   * Logout user - clears tokens and revokes on server
   */
  async logout(): Promise<void> {
    try {
      await api.post('/accounts/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of server response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
    }
  },
  
  /**
   * Get current user from API
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/accounts/me');
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
    
    const response = await api.post<AuthTokens>('/accounts/refresh', { refresh_token });
    const { access_token, refresh_token: new_refresh_token, token_type } = response.data;
    
    // Store new tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', new_refresh_token);
    localStorage.setItem('token_type', token_type);
    localStorage.setItem('auth_token', access_token); // For api.ts compatibility
    
    return { access_token, refresh_token: new_refresh_token, token_type };
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
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
  }
};

export default authService;
