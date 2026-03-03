/**
 * Admin Module API Service
 * Separated API service for admin module - no cross-role dependencies
 */

import axios, { AxiosInstance } from 'axios';
import { AdminStats, CollegeManagement, FeatureToggle, RolePermission } from './types';

// Local type definition for paginated responses
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
  pages?: number;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Create axios instance for admin API
const createAdminApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });

  // Request interceptor - add auth token
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

const adminApi = createAdminApiClient();

// Dashboard
export const fetchAdminStats = async (): Promise<AdminStats> => {
  const response = await adminApi.get<AdminStats>('/admin/dashboard');
  return response.data;
};

// Users Management
export const fetchUsers = async (page = 1, pageSize = 20, role?: string, collegeId?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());
  if (role) params.append('role', role);
  if (collegeId) params.append('college_id', collegeId);
  
  const response = await adminApi.get<PaginatedResponse<any>>(`/admin/users?${params}`);
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await adminApi.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (userId: string, userData: any) => {
  const response = await adminApi.patch(`/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await adminApi.delete(`/admin/users/${userId}`);
  return response.data;
};

export const bulkUploadUsers = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await adminApi.post('/admin/users/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Classes Management
export const fetchClasses = async (page = 1, pageSize = 20) => {
  const response = await adminApi.get<PaginatedResponse<any>>(`/admin/classes?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const createClass = async (classData: any) => {
  const response = await adminApi.post('/admin/classes', classData);
  return response.data;
};

export const deleteClass = async (classId: string) => {
  const response = await adminApi.delete(`/admin/classes/${classId}`);
  return response.data;
};

// Sessions Management
export const fetchSessions = async (page = 1, pageSize = 20) => {
  const response = await adminApi.get<PaginatedResponse<any>>(`/admin/sessions?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const fetchSessionDetail = async (sessionId: string) => {
  const response = await adminApi.get(`/admin/sessions/${sessionId}`);
  return response.data;
};

// Analytics

// =============================================================================
// COLLEGE MANAGEMENT API
// =============================================================================

export interface College {
  id: string;
  name: string;
  code: string;
  domain?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  active_features_count?: number;
  users_added_count?: number;  // Number of users added during creation
}

export interface CollegeFeature {
  feature_key: string;
  is_enabled: boolean;
}

export interface CollegeFeatureResponse {
  items: CollegeFeature[];
  total: number;
}

export interface RoleFeaturePermission {
  role: string;
  feature_key: string;
  is_enabled: boolean;
  college_feature_enabled?: boolean;
}

export interface RoleFeatureResponse {
  items: RoleFeaturePermission[];
  total: number;
}

// Fetch all colleges
export const fetchColleges = async (page = 1, pageSize = 20, isActive?: boolean) => {
  const params = new URLSearchParams();
  params.append('skip', ((page - 1) * pageSize).toString());
  params.append('limit', pageSize.toString());
  if (isActive !== undefined) params.append('is_active', isActive.toString());
  
  const response = await adminApi.get<any>(`/platform/admin/colleges?${params}`);
  return response.data;
};

// Fetch single college
export const fetchCollege = async (collegeId: string) => {
  const response = await adminApi.get<College>(`/platform/admin/colleges/${collegeId}`);
  return response.data;
};

// Create college
export const createCollege = async (collegeData: { name: string; code: string; domain?: string; add_existing_users?: boolean }) => {
  const response = await adminApi.post<College>('/platform/admin/colleges', collegeData);
  return response.data;
};

// Update college
export const updateCollege = async (collegeId: string, collegeData: Partial<College>) => {
  const response = await adminApi.patch<College>(`/platform/admin/colleges/${collegeId}`, collegeData);
  return response.data;
};

// Delete college
export const deleteCollege = async (collegeId: string) => {
  const response = await adminApi.delete(`/platform/admin/colleges/${collegeId}`);
  return response.data;
};

// Fetch college features
export const fetchCollegeFeatures = async (collegeId: string) => {
  const response = await adminApi.get<CollegeFeatureResponse>(`/platform/admin/colleges/${collegeId}/features`);
  return response.data;
};

// Toggle college feature
export const toggleCollegeFeature = async (
  collegeId: string, 
  featureKey: string, 
  isEnabled: boolean
) => {
  const response = await adminApi.patch<CollegeFeature>(
    `/platform/admin/colleges/${collegeId}/features`,
    { feature_key: featureKey, is_enabled: isEnabled }
  );
  return response.data;
};

// Toggle college status (activate/deactivate)
export const toggleCollegeStatus = async (collegeId: string, isActive: boolean) => {
  const response = await adminApi.patch<College>(
    `/platform/admin/colleges/${collegeId}/toggle`,
    { is_active: isActive }
  );
  return response.data;
};

// Fetch role features
export const fetchRoleFeatures = async (collegeId: string, role?: string) => {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  
  const response = await adminApi.get<RoleFeatureResponse>(
    `/platform/admin/colleges/${collegeId}/roles/features?${params}`
  );
  return response.data;
};

// Toggle role feature
export const toggleRoleFeature = async (
  collegeId: string,
  role: string,
  featureKey: string,
  isEnabled: boolean
) => {
  const response = await adminApi.patch<RoleFeaturePermission>(
    `/platform/admin/colleges/${collegeId}/roles/features`,
    { role, feature_key: featureKey, is_enabled: isEnabled }
  );
  return response.data;
};

// Fetch users for a specific college
export const fetchCollegeUsers = async (
  collegeId: string,
  page = 1,
  pageSize = 20,
  role?: string,
  isActive?: boolean
) => {
  const params = new URLSearchParams();
  params.append('skip', ((page - 1) * pageSize).toString());
  params.append('limit', pageSize.toString());
  params.append('college_id', collegeId);
  if (role) params.append('role', role);
  if (isActive !== undefined) params.append('is_active', isActive.toString());
  
  const response = await adminApi.get<any>(`/platform/admin/users?${params}`);
  return response.data;
};
