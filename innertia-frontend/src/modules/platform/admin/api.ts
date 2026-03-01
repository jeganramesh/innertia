/**
 * Platform Admin API Service
 * Centralized API calls for college management and feature toggles
 */

import axios, { AxiosInstance } from 'axios';
import {
  College,
  CollegeCreatePayload,
  CollegeUpdatePayload,
  PaginatedColleges,
  CollegeFeature,
  CollegeFeaturePayload,
  CollegeFeaturesResponse,
  RoleFeaturePermission,
  RoleFeaturePayload,
  RoleFeaturesResponse,
  CollegeUser,
  PaginatedUsers,
} from './types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Create axios instance
const createApiClient = (): AxiosInstance => {
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

const apiClient = createApiClient();

// College API Methods
export const collegeApi = {
  // List all colleges with pagination
  getColleges: async (page = 1, pageSize = 20, isActive?: boolean): Promise<PaginatedColleges> => {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * pageSize).toString());
    params.append('limit', pageSize.toString());
    if (isActive !== undefined) params.append('is_active', isActive.toString());
    
    const response = await apiClient.get<PaginatedColleges>(`/platform/admin/colleges?${params}`);
    return response.data;
  },

  // Get single college by ID
  getCollege: async (collegeId: string): Promise<College> => {
    const response = await apiClient.get<College>(`/platform/admin/colleges/${collegeId}`);
    return response.data;
  },

  // Create new college
  createCollege: async (data: CollegeCreatePayload): Promise<College> => {
    const response = await apiClient.post<College>('/platform/admin/colleges', data);
    return response.data;
  },

  // Update college
  updateCollege: async (collegeId: string, data: CollegeUpdatePayload): Promise<College> => {
    const response = await apiClient.patch<College>(`/platform/admin/colleges/${collegeId}`, data);
    return response.data;
  },

  // Delete (deactivate) college
  deleteCollege: async (collegeId: string): Promise<void> => {
    await apiClient.delete(`/platform/admin/colleges/${collegeId}`);
  },

  // Toggle college active status
  toggleCollegeStatus: async (collegeId: string, isActive: boolean): Promise<College> => {
    const response = await apiClient.patch<College>(`/platform/admin/colleges/${collegeId}/toggle`, { is_active: isActive });
    return response.data;
  },
};

// College Features API Methods
export const collegeFeaturesApi = {
  // Get all features for a college
  getFeatures: async (collegeId: string): Promise<CollegeFeaturesResponse> => {
    const response = await apiClient.get<CollegeFeaturesResponse>(
      `/platform/admin/colleges/${collegeId}/features`
    );
    return response.data;
  },

  // Toggle a feature for a college
  toggleFeature: async (collegeId: string, payload: CollegeFeaturePayload): Promise<CollegeFeature> => {
    const response = await apiClient.patch<CollegeFeature>(
      `/platform/admin/colleges/${collegeId}/features`,
      payload
    );
    return response.data;
  },
};

// Role Features API Methods
export const roleFeaturesApi = {
  // Get role features for a college
  getRoleFeatures: async (collegeId: string, role?: string): Promise<RoleFeaturesResponse> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    
    const response = await apiClient.get<RoleFeaturesResponse>(
      `/platform/admin/colleges/${collegeId}/roles/features?${params}`
    );
    return response.data;
  },

  // Toggle a role feature
  toggleRoleFeature: async (
    collegeId: string,
    payload: RoleFeaturePayload
  ): Promise<RoleFeaturePermission> => {
    const response = await apiClient.patch<RoleFeaturePermission>(
      `/platform/admin/colleges/${collegeId}/roles/features`,
      payload
    );
    return response.data;
  },
};

// College Users API Methods
export const collegeUsersApi = {
  // Get users for a specific college
  getUsers: async (
    collegeId: string,
    page = 1,
    pageSize = 20,
    role?: string,
    isActive?: boolean
  ): Promise<PaginatedUsers> => {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * pageSize).toString());
    params.append('limit', pageSize.toString());
    params.append('college_id', collegeId);
    if (role) params.append('role', role);
    if (isActive !== undefined) params.append('is_active', isActive.toString());
    
    const response = await apiClient.get<PaginatedUsers>(`/platform/admin/users?${params}`);
    return response.data;
  },
};

export default {
  college: collegeApi,
  features: collegeFeaturesApi,
  roleFeatures: roleFeaturesApi,
  users: collegeUsersApi,
};
