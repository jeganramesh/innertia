/**
 * Student Management API
 * API functions for departments, batches, custom fields, and enhanced student management
 */

import { api } from '../../../../services/api';

// Types
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldOption {
  value: string;
  label: string;
}

export interface CustomField {
  id: string;
  name: string;
  field_key: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: CustomFieldOption[];
  is_required: boolean;
  is_filterable: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API Base
const BASE_URL = '/college-admin';

// Departments API
export const departmentsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Department>> => {
    const response = await api.get(`${BASE_URL}/departments`, { params });
    return response.data;
  },

  get: async (id: string): Promise<Department> => {
    const response = await api.get(`${BASE_URL}/departments/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    code: string;
    description?: string;
  }): Promise<Department> => {
    const response = await api.post(`${BASE_URL}/departments`, data);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Department> => {
    const response = await api.patch(`${BASE_URL}/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/departments/${id}`);
  },
};

// Custom Fields API
export const customFieldsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CustomField>> => {
    const response = await api.get(`${BASE_URL}/custom-fields`, { params });
    return response.data;
  },

  get: async (id: string): Promise<CustomField> => {
    const response = await api.get(`${BASE_URL}/custom-fields/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    field_key: string;
    field_type: string;
    options?: CustomFieldOption[];
    is_required?: boolean;
    is_filterable?: boolean;
    display_order?: number;
  }): Promise<CustomField> => {
    const response = await api.post(`${BASE_URL}/custom-fields`, data);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    field_type?: string;
    options?: CustomFieldOption[];
    is_required?: boolean;
    is_filterable?: boolean;
    display_order?: number;
  }): Promise<CustomField> => {
    const response = await api.patch(`${BASE_URL}/custom-fields/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/custom-fields/${id}`);
  },
};
