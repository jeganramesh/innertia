/**
 * Faculty API Service
 * Handles all /faculty/* endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Types
export interface Class {
  id: string;
  name: string;
  subject: string;
  description?: string;
  studentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  lastSession?: string;
}

export interface Session {
  id: string;
  classId: string;
  className: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  attendeeCount?: number;
  duration?: number;
}

export interface CreateClassInput {
  name: string;
  subject: string;
  description?: string;
}

export interface UpdateClassInput {
  name?: string;
  subject?: string;
  description?: string;
  status?: 'active' | 'archived';
}

export interface SessionReport {
  sessionId: string;
  className: string;
  date: string;
  duration: number;
  attendance: {
    present: number;
    absent: number;
    rate: number;
  };
  engagement: {
    average: number;
    peak: number;
  };
  notes?: string;
}

export interface FacultyStats {
  totalClasses: number;
  activeClasses: number;
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
}

export interface UploadFileResponse {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  status: 'completed' | 'processing' | 'error';
  progress: number;
}

// Create axios instance for faculty API
const createFacultyApi = (): AxiosInstance => {
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

const facultyApi = createFacultyApi();

// Faculty API Service
export const facultyService = {
  /**
   * Get all classes for faculty
   */
  async getClasses(): Promise<Class[]> {
    const response = await facultyApi.get<Class[]>('/faculty/classes');
    return response.data;
  },

  /**
   * Get class by ID
   */
  async getClassById(classId: string): Promise<Class> {
    const response = await facultyApi.get<Class>(`/faculty/classes/${classId}`);
    return response.data;
  },

  /**
   * Create a new class
   */
  async createClass(data: CreateClassInput): Promise<Class> {
    const response = await facultyApi.post<Class>('/faculty/classes', data);
    return response.data;
  },

  /**
   * Update a class
   */
  async updateClass(classId: string, data: UpdateClassInput): Promise<Class> {
    const response = await facultyApi.patch<Class>(`/faculty/classes/${classId}`, data);
    return response.data;
  },

  /**
   * Delete a class
   */
  async deleteClass(classId: string): Promise<void> {
    await facultyApi.delete(`/faculty/classes/${classId}`);
  },

  /**
   * Get sessions for a class
   */
  async getSessionsByClass(classId: string): Promise<Session[]> {
    const response = await facultyApi.get<Session[]>(`/faculty/classes/${classId}/sessions`);
    return response.data;
  },

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<Session[]> {
    const response = await facultyApi.get<Session[]>('/faculty/sessions');
    return response.data;
  },

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit?: number): Promise<Session[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await facultyApi.get<Session[]>(`/faculty/sessions/recent${params}`);
    return response.data;
  },

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<Session> {
    const response = await facultyApi.get<Session>(`/faculty/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Start a session
   */
  async startSession(classId: string): Promise<Session> {
    const response = await facultyApi.post<Session>(`/faculty/classes/${classId}/sessions/start`);
    return response.data;
  },

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<Session> {
    const response = await facultyApi.post<Session>(`/faculty/sessions/${sessionId}/end`);
    return response.data;
  },

  /**
   * Get session report
   */
  async getSessionReport(sessionId: string): Promise<SessionReport> {
    const response = await facultyApi.get<SessionReport>(`/faculty/sessions/${sessionId}/report`);
    return response.data;
  },

  /**
   * Get faculty statistics
   */
  async getStats(): Promise<FacultyStats> {
    const response = await facultyApi.get<FacultyStats>('/faculty/stats');
    return response.data;
  },

  /**
   * Upload file to a class
   */
  async uploadFile(classId: string, file: File, onProgress?: (progress: number) => void): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await facultyApi.post<UploadFileResponse>(
      `/faculty/classes/${classId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
    return response.data;
  },

  /**
   * Get files for a class
   */
  async getFilesByClass(classId: string): Promise<UploadFileResponse[]> {
    const response = await facultyApi.get<UploadFileResponse[]>(`/faculty/classes/${classId}/files`);
    return response.data;
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    await facultyApi.delete(`/faculty/files/${fileId}`);
  }
};

export default facultyService;
