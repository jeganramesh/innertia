/**
 * Student API Service
 * Handles student-specific API calls
 * Maps to backend /student/* routes
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_V1_PREFIX = '/api/v1';

// Types matching backend schemas
export interface StudentClass {
  id: string;
  name: string;
  description?: string;
  faculty_name?: string;
  is_active: boolean;
  enrolled_at: string;
}

export interface StudentSession {
  id: string;
  class_id: string;
  class_name: string;
  started_at: string;
  ended_at?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface StudentNote {
  id: string;
  session_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface StudentDashboard {
  enrolled_classes: StudentClass[];
  recent_sessions: StudentSession[];
  stats: {
    total_classes: number;
    total_sessions: number;
    attendance_rate: number;
  };
}

// Create axios instance with interceptors
const createStudentApiClient = (): AxiosInstance => {
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

const studentApi = createStudentApiClient();

// Student API Service
export const studentApiService = {
  // ============ Class Enrollment ============

  /**
   * Get enrolled classes
   */
  async getEnrolledClasses(): Promise<StudentClass[]> {
    const response = await studentApi.get<StudentClass[]>('/student/classes');
    return response.data;
  },

  /**
   * Enroll in a class
   */
  async enrollInClass(classId: string): Promise<{ success: boolean }> {
    const response = await studentApi.post<{ success: boolean }>(`/student/classes/${classId}/enroll`);
    return response.data;
  },

  /**
   * Unenroll from a class
   */
  async unenrollFromClass(classId: string): Promise<{ success: boolean }> {
    const response = await studentApi.delete<{ success: boolean }>(`/student/classes/${classId}/enroll`);
    return response.data;
  },

  // ============ Sessions ============

  /**
   * Get upcoming and recent sessions
   */
  async getSessions(): Promise<StudentSession[]> {
    const response = await studentApi.get<StudentSession[]>('/student/sessions');
    return response.data;
  },

  /**
   * Join a session (mark attendance)
   */
  async joinSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await studentApi.post<{ success: boolean }>(`/student/sessions/${sessionId}/join`);
    return response.data;
  },

  /**
   * Leave a session
   */
  async leaveSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await studentApi.post<{ success: boolean }>(`/student/sessions/${sessionId}/leave`);
    return response.data;
  },

  /**
   * Get current session status
   */
  async getCurrentSession(): Promise<StudentSession | null> {
    const response = await studentApi.get<StudentSession | null>('/student/sessions/current');
    return response.data;
  },

  // ============ Notes ============

  /**
   * Get notes for a session
   */
  async getSessionNotes(sessionId: string): Promise<StudentNote[]> {
    const response = await studentApi.get<StudentNote[]>(`/student/sessions/${sessionId}/notes`);
    return response.data;
  },

  /**
   * Create/update note for a session
   */
  async saveNote(sessionId: string, content: string): Promise<StudentNote> {
    const response = await studentApi.post<StudentNote>(`/student/sessions/${sessionId}/notes`, { content });
    return response.data;
  },

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<{ success: boolean }> {
    const response = await studentApi.delete<{ success: boolean }>(`/student/notes/${noteId}`);
    return response.data;
  },

  // ============ Dashboard ============

  /**
   * Get student dashboard data
   */
  async getDashboard(): Promise<StudentDashboard> {
    const response = await studentApi.get<StudentDashboard>('/student/dashboard');
    return response.data;
  },

  // ============ Profile ============

  /**
   * Get student profile
   */
  async getProfile(): Promise<{
    id: string;
    email: string;
    name: string;
    enrolled_classes_count: number;
  }> {
    const response = await studentApi.get<{
      id: string;
      email: string;
      name: string;
      enrolled_classes_count: number;
    }>('/student/profile');
    return response.data;
  },

  /**
   * Update student profile
   */
  async updateProfile(data: { name?: string }): Promise<{ success: boolean }> {
    const response = await studentApi.patch<{ success: boolean }>('/student/profile', data);
    return response.data;
  }
};

export default studentApiService;
