/**
 * Admin API Service
 * Handles admin-specific API calls
 * Maps to backend /admin/* routes
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// Types matching backend schemas
export interface UserCreateAdmin {
  email: string;
  name?: string;
  role: 'student' | 'faculty' | 'admin';
  is_active: boolean;
  password: string;
}

export interface UserUpdateAdmin {
  name?: string;
  role?: 'student' | 'faculty' | 'admin';
  is_active?: boolean;
}

export interface UserOutAdmin {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  users: UserOutAdmin[];
  total: number;
  page: number;
  page_size: number;
}

export interface BulkUploadResponse {
  created_count: number;
  updated_count: number;
  failed_rows: { row: number; error: string; email?: string }[];
}

export interface ClassCreate {
  name: string;
  description?: string;
  faculty_id: string;
}

export interface ClassUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface ClassOut {
  id: string;
  name: string;
  description?: string;
  faculty_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_students: number;
  total_faculty: number;
  total_admins: number;
  total_classes: number;
  total_sessions: number;
  active_sessions: number;
  last_30_day_sessions: number;
  users_by_role: {
    admin: number;
    faculty: number;
    student: number;
  };
}

export interface SessionMonitorOut {
  id: string;
  class_id: string;
  class_name: string;
  faculty_id: string;
  faculty_name: string;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
  duration_minutes?: number;
  student_count: number;
  engagement_percent?: number;
}

export interface SessionListResponse {
  sessions: SessionMonitorOut[];
  total: number;
  page: number;
  page_size: number;
}

// Create axios instance with interceptors
const createAdminApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_PREFIX}`,
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

  // Response interceptor - handle 401/403
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

const adminApi = createAdminApiClient();

// Admin API Service
export const adminApiService = {
  // ============ User Management ============

  /**
   * Create a new user (admin only)
   */
  async createUser(data: UserCreateAdmin): Promise<UserOutAdmin> {
    const response = await adminApi.post<UserOutAdmin>('/admin/users', data);
    return response.data;
  },

  /**
   * List users with pagination and filters
   */
  async listUsers(params?: {
    page?: number;
    page_size?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<UserListResponse> {
    const response = await adminApi.get<UserListResponse>('/admin/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<UserOutAdmin> {
    const response = await adminApi.get<UserOutAdmin>(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(userId: string, data: UserUpdateAdmin): Promise<UserOutAdmin> {
    const response = await adminApi.patch<UserOutAdmin>(`/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await adminApi.delete(`/admin/users/${userId}`);
  },

  // ============ Bulk Upload ============

  /**
   * Bulk upload users from CSV/Excel file
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

  // ============ Class Management ============

  /**
   * Create a new class
   */
  async createClass(data: ClassCreate): Promise<ClassOut> {
    const response = await adminApi.post<ClassOut>('/admin/classes', data);
    return response.data;
  },

  /**
   * List classes
   */
  async listClasses(params?: {
    page?: number;
    page_size?: number;
    faculty_id?: string;
  }): Promise<{ classes: ClassOut[]; total: number }> {
    const response = await adminApi.get<{ classes: ClassOut[]; total: number }>('/admin/classes', { params });
    return response.data;
  },

  /**
   * Get class by ID
   */
  async getClass(classId: string): Promise<ClassOut> {
    const response = await adminApi.get<ClassOut>(`/admin/classes/${classId}`);
    return response.data;
  },

  /**
   * Update class
   */
  async updateClass(classId: string, data: ClassUpdate): Promise<ClassOut> {
    const response = await adminApi.patch<ClassOut>(`/admin/classes/${classId}`, data);
    return response.data;
  },

  /**
   * Delete class
   */
  async deleteClass(classId: string): Promise<void> {
    await adminApi.delete(`/admin/classes/${classId}`);
  },

  // ============ Dashboard ============

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await adminApi.get<DashboardStats>('/admin/dashboard');
    return response.data;
  },

  // ============ Session Monitoring ============

  /**
   * Get session monitoring list
   */
  async getSessions(params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
  }): Promise<SessionListResponse> {
    const response = await adminApi.get<SessionListResponse>('/admin/sessions', { params });
    return response.data;
  },

  // ============ User Toggle ============

  /**
   * Toggle user active status
   */
  async toggleUser(userId: string): Promise<UserOutAdmin> {
    const response = await adminApi.patch<UserOutAdmin>(`/admin/users/${userId}/toggle`);
    return response.data;
  }
};

export default adminApiService;
