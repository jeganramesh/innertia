/**
 * Admin API Service
 * Handles platform admin-specific API calls
 * Maps to backend /platform-admin/* routes
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// Types matching backend schemas
export interface UserCreateAdmin {
  email: string;
  name?: string;
  role: 'student' | 'faculty' | 'admin' | 'college_admin' | 'staff' | 'trainer';
  is_active: boolean;
  password: string;
  college_id?: string;
}

export interface UserUpdateAdmin {
  name?: string;
  role?: 'student' | 'faculty' | 'admin' | 'college_admin' | 'staff' | 'trainer';
  is_active?: boolean;
}

export interface UserOutAdmin {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  college_id?: string | number;
  college_name?: string;
}

export interface UserListResponse {
  items: UserOutAdmin[];
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
  average_attendance_rate: number;
  total_violations_7_days: number;
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

export interface AttendanceAnalyticsResponse {
  date: string;
  attendance_rate: number;
  session_count: number;
  violation_count: number;
}

export interface AttendanceAnalyticsSummary {
  daily_data: AttendanceAnalyticsResponse[];
  average_attendance_rate: number;
  total_sessions: number;
  total_violations: number;
  date_range_start: string;
  date_range_end: string;
}

export interface SystemSettings {
  attendance_threshold: number;
  max_focus_violations: number;
  session_timeout_minutes: number;
}

export interface AuditLogResponse {
  id: string;
  action: string;
  performed_by: string;
  target_type?: string;
  target_id?: number;
  metadata_json?: string;
  created_at: string;
  ip_address?: string;
}

export interface AuditLogListResponse {
  items: AuditLogResponse[];
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
    withCredentials: false,
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
        window.location.href = '/login';      }
      console.error('Admin API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
      return Promise.reject(error);
    }
  );

  return client;
};

const adminApi = createAdminApiClient();

// Admin API Service - Platform Admin endpoints
// Maps to backend /api/v1/admin/* and /api/v1/platform/admin/* routes
export const adminApiService = {
  // ============ User Management ============

  async createUser(data: UserCreateAdmin): Promise<UserOutAdmin> {
    // Backend expects form-style data for create user
    const formData = new URLSearchParams();
    formData.append('email', data.email);
    formData.append('password', data.password);
    if (data.name) formData.append('full_name', data.name);
    formData.append('role', data.role);
    if (data.college_id) formData.append('college_id', data.college_id);
    
    const response = await adminApi.post<UserOutAdmin>('/admin/users', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  async listUsers(params?: {
    page?: number;
    page_size?: number;
    role?: string;
    college_id?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<UserListResponse> {
    // Convert page to skip/limit for backend
    const backendParams: any = {
      skip: ((params?.page || 1) - 1) * (params?.page_size || 10),
      limit: params?.page_size || 10,
    };
    if (params?.role) backendParams.role = params.role;
    if (params?.college_id) backendParams.college_id = params.college_id;
    if (params?.is_active !== undefined) backendParams.is_active = params.is_active;
    if (params?.search) backendParams.search = params.search;
    
    const response = await adminApi.get<UserListResponse>('/admin/users', { params: backendParams });
    return response.data;
  },

  async getUser(userId: string): Promise<UserOutAdmin> {
    // Get all users and find the one we need (backend doesn't have single user endpoint)
    const response = await adminApi.get<UserListResponse>('/admin/users', { 
      params: { skip: 0, limit: 1000 } 
    });
    const user = response.data.items.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  async updateUser(userId: string, data: UserUpdateAdmin): Promise<UserOutAdmin> {
    // Backend uses form-style data for update
    const formData = new URLSearchParams();
    if (data.name !== undefined) formData.append('full_name', data.name);
    if (data.role !== undefined) formData.append('role', data.role);
    if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString());
    
    const response = await adminApi.patch<UserOutAdmin>(`/admin/users/${userId}`, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  async toggleUser(userId: string): Promise<UserOutAdmin> {
    // Get current user state first
    const user = await this.getUser(userId);
    // Toggle the is_active status
    return this.updateUser(userId, { is_active: !user.is_active });
  },

  async deleteUser(userId: string): Promise<void> {
    await adminApi.delete(`/admin/users/${userId}`);
  },

  // ============ Bulk Upload ============

  async bulkUploadUsers(file: File): Promise<BulkUploadResponse> {
    // Not implemented in backend yet
    throw new Error('Bulk upload not implemented');
  },

  // ============ Class Management ============
  // Note: These endpoints may not exist in backend yet

  async createClass(data: ClassCreate): Promise<ClassOut> {
    const response = await adminApi.post<ClassOut>('/admin/classes', data);
    return response.data;
  },

  async listClasses(params?: {
    page?: number;
    page_size?: number;
    faculty_id?: string;
  }): Promise<{ items: ClassOut[]; total: number }> {
    const response = await adminApi.get<{ items: ClassOut[]; total: number }>('/admin/classes', { params });
    return response.data;
  },

  async getClass(classId: string): Promise<ClassOut> {
    const response = await adminApi.get<ClassOut>(`/admin/classes/${classId}`);
    return response.data;
  },

  async updateClass(classId: string, data: ClassUpdate): Promise<ClassOut> {
    const response = await adminApi.patch<ClassOut>(`/admin/classes/${classId}`, data);
    return response.data;
  },

  async deleteClass(classId: string): Promise<void> {
    await adminApi.delete(`/admin/classes/${classId}`);
  },

  // ============ Dashboard ============

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await adminApi.get<DashboardStats>('/admin/dashboard');
    return response.data;
  },

  // ============ Session Monitoring ============

  async getSessions(params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
  }): Promise<SessionListResponse> {
    const response = await adminApi.get<SessionListResponse>('/admin/sessions', { params });
    return response.data;
  },

  // ============ Settings ============
  // Note: Settings endpoints may not exist in backend yet

  async getSettings(): Promise<SystemSettings> {
    throw new Error('Settings not implemented');
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    throw new Error('Settings not implemented');
  },

  // ============ Audit Logs ============

  async getAuditLogs(params?: {
    page?: number;
    page_size?: number;
    action?: string;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    user_id?: string;
  }): Promise<AuditLogListResponse> {
    const backendParams: any = {
      skip: ((params?.page || 1) - 1) * (params?.page_size || 10),
      limit: params?.page_size || 10,
    };
    if (params?.action) backendParams.action = params.action;
    if (params?.entity_type) backendParams.target_type = params.entity_type;
    if (params?.user_id) backendParams.performed_by = params.user_id;
    
    const response = await adminApi.get<AuditLogListResponse>('/admin/audit-logs', { params: backendParams });
    return response.data;
  }
};

export default adminApiService;
