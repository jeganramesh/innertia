/**
 * Admin API Service
 * Handles all /admin/* endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'student' | 'faculty' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
}

export interface UpdateUserInput {
  email?: string;
  full_name?: string;
  role?: 'student' | 'faculty' | 'admin';
  is_active?: boolean;
  is_verified?: boolean;
}

export interface BulkUploadResponse {
  success: boolean;
  created_count: number;
  updated_count: number;
  failed_rows: BulkUploadError[];
  message?: string;
}

export interface BulkUploadError {
  row: number;
  email: string;
  error: string;
}

export interface BulkUploadTemplateRow {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  description?: string;
  studentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  classId: string;
  className: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  attendeeCount?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalClasses: number;
  totalSessions: number;
  activeSessions: number;
}

// Create axios instance for admin API
const createAdminApi = (): AxiosInstance => {
  const api = axios.create({
    baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor - add auth token
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
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        window.location.href = '/forbidden';
      }
      return Promise.reject(error);
    }
  );

  return api;
};

const adminApi = createAdminApi();

// Admin API Service
export const adminService = {
  /**
   * Get all users with optional filters
   */
  async getUsers(filters?: {
    role?: 'student' | 'faculty' | 'admin';
    is_active?: boolean;
    search?: string;
  }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await adminApi.get<User[]>(`/admin/users?${params.toString()}`);
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const response = await adminApi.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  async createUser(data: CreateUserInput): Promise<User> {
    const response = await adminApi.post<User>('/admin/users', data);
    return response.data;
  },

  /**
   * Update a user
   */
  async updateUser(userId: string, data: UpdateUserInput): Promise<User> {
    const response = await adminApi.patch<User>(`/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    await adminApi.delete(`/admin/users/${userId}`);
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    const response = await adminApi.patch<User>(`/admin/users/${userId}/toggle-active`, { is_active: isActive });
    return response.data;
  },

  /**
   * Bulk upload users from CSV/Excel
   */
  async bulkUploadUsers(file: File): Promise<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await adminApi.post<BulkUploadResponse>('/admin/users/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Download bulk upload template
   */
  async downloadTemplate(): Promise<Blob> {
    const response = await adminApi.get('/admin/users/upload/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get all classes
   */
  async getClasses(): Promise<Class[]> {
    const response = await adminApi.get<Class[]>('/admin/classes');
    return response.data;
  },

  /**
   * Create a new class
   */
  async createClass(data: Partial<Class>): Promise<Class> {
    const response = await adminApi.post<Class>('/admin/classes', data);
    return response.data;
  },

  /**
   * Update a class
   */
  async updateClass(classId: string, data: Partial<Class>): Promise<Class> {
    const response = await adminApi.patch<Class>(`/admin/classes/${classId}`, data);
    return response.data;
  },

  /**
   * Delete a class
   */
  async deleteClass(classId: string): Promise<void> {
    await adminApi.delete(`/admin/classes/${classId}`);
  },

  /**
   * Get all sessions
   */
  async getSessions(filters?: {
    status?: 'scheduled' | 'in_progress' | 'completed';
    classId?: string;
  }): Promise<Session[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.classId) params.append('class_id', filters.classId);
    
    const response = await adminApi.get<Session[]>(`/admin/sessions?${params.toString()}`);
    return response.data;
  },

  /**
   * Get admin statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await adminApi.get<AdminStats>('/admin/stats');
    return response.data;
  },

  /**
   * Get analytics data
   */
  async getAnalytics(period?: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await adminApi.get(`/admin/analytics${params}`);
    return response.data;
  }
};

export default adminService;
