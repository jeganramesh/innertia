/**
 * Student API Service
 * Handles all /student/* endpoints
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
  instructor?: string;
  studentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  classId: string;
  className: string;
  instructorName: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  isLocked: boolean;
  attendeeCount?: number;
}

export interface SessionReport {
  sessionId: string;
  className: string;
  date: string;
  duration: number;
  attendance: {
    present: boolean;
    rate: number;
  };
  engagement?: {
    average: number;
  };
  notes?: string;
}

export interface StudentStats {
  enrolledClasses: number;
  completedSessions: number;
  upcomingSessions: number;
  averageAttendance: number;
}

export interface Note {
  id: string;
  sessionId: string;
  className: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  sessionId: string;
  content: string;
}

export interface UpdateNoteInput {
  content: string;
}

// Create axios instance for student API
const createStudentApi = (): AxiosInstance => {
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

const studentApi = createStudentApi();

// Student API Service
export const studentService = {
  /**
   * Get enrolled classes
   */
  async getEnrolledClasses(): Promise<Class[]> {
    const response = await studentApi.get<Class[]>('/student/classes');
    return response.data;
  },

  /**
   * Get class by ID
   */
  async getClassById(classId: string): Promise<Class> {
    const response = await studentApi.get<Class>(`/student/classes/${classId}`);
    return response.data;
  },

  /**
   * Enroll in a class
   */
  async enrollInClass(classId: string): Promise<void> {
    await studentApi.post(`/student/classes/${classId}/enroll`);
  },

  /**
   * Unenroll from a class
   */
  async unenrollFromClass(classId: string): Promise<void> {
    await studentApi.delete(`/student/classes/${classId}/enroll`);
  },

  /**
   * Get all sessions (enrolled classes)
   */
  async getAllSessions(): Promise<Session[]> {
    const response = await studentApi.get<Session[]>('/student/sessions');
    return response.data;
  },

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<Session> {
    const response = await studentApi.get<Session>(`/student/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions(): Promise<Session[]> {
    const response = await studentApi.get<Session[]>('/student/sessions/upcoming');
    return response.data;
  },

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit?: number): Promise<Session[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await studentApi.get<Session[]>(`/student/sessions/recent${params}`);
    return response.data;
  },

  /**
   * Join a session
   */
  async joinSession(sessionId: string): Promise<{ joinUrl: string }> {
    const response = await studentApi.post<{ joinUrl: string }>(`/student/sessions/${sessionId}/join`);
    return response.data;
  },

  /**
   * Leave a session
   */
  async leaveSession(sessionId: string): Promise<void> {
    await studentApi.post(`/student/sessions/${sessionId}/leave`);
  },

  /**
   * Get session report
   */
  async getSessionReport(sessionId: string): Promise<SessionReport> {
    const response = await studentApi.get<SessionReport>(`/student/sessions/${sessionId}/report`);
    return response.data;
  },

  /**
   * Get student statistics
   */
  async getStats(): Promise<StudentStats> {
    const response = await studentApi.get<StudentStats>('/student/stats');
    return response.data;
  },

  /**
   * Get all notes
   */
  async getNotes(): Promise<Note[]> {
    const response = await studentApi.get<Note[]>('/student/notes');
    return response.data;
  },

  /**
   * Get note by ID
   */
  async getNoteById(noteId: string): Promise<Note> {
    const response = await studentApi.get<Note>(`/student/notes/${noteId}`);
    return response.data;
  },

  /**
   * Create a note
   */
  async createNote(data: CreateNoteInput): Promise<Note> {
    const response = await studentApi.post<Note>('/student/notes', data);
    return response.data;
  },

  /**
   * Update a note
   */
  async updateNote(noteId: string, data: UpdateNoteInput): Promise<Note> {
    const response = await studentApi.patch<Note>(`/student/notes/${noteId}`, data);
    return response.data;
  },

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    await studentApi.delete(`/student/notes/${noteId}`);
  },

  /**
   * Get notes by session
   */
  async getNotesBySession(sessionId: string): Promise<Note[]> {
    const response = await studentApi.get<Note[]>(`/student/sessions/${sessionId}/notes`);
    return response.data;
  }
};

export default studentService;
