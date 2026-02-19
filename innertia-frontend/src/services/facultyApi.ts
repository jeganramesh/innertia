/**
 * Faculty API Service
 * Handles faculty-specific API calls
 * Maps to backend /faculty/* routes
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_V1_PREFIX = '/api/v1';

// Types matching backend schemas
export interface ClassOut {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassWithEnrollment extends ClassOut {
  enrollment_count: number;
}

export interface SessionStart {
  class_id: string;
}

export interface SessionOut {
  id: string;
  class_id: string;
  started_at: string;
  ended_at?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface SlideLockToggle {
  slide_number: number;
  locked: boolean;
}

export interface SlideStateOut {
  slide_number: number;
  locked: boolean;
  locked_by?: string;
  locked_at?: string;
}

export interface StudentSyncStatus {
  student_id: string;
  student_name: string;
  current_slide: number;
  synced_at: string;
}

export interface StudentSyncList {
  students: StudentSyncStatus[];
}

export interface FacultyDashboard {
  classes: ClassWithEnrollment[];
  recent_sessions: SessionOut[];
  stats: {
    total_classes: number;
    active_sessions: number;
    total_students: number;
  };
}

// Student upload types for faculty
export interface StudentUploadResponse {
  created_count: number;
  updated_count: number;
  failed_rows: { row: number; error: string; email?: string }[];
}

// Create axios instance with interceptors
const createFacultyApiClient = (): AxiosInstance => {
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

const facultyApi = createFacultyApiClient();

// Faculty API Service
export const facultyApiService = {
  // ============ Class Management ============

  /**
   * Get all classes assigned to the faculty
   */
  async getClasses(): Promise<ClassWithEnrollment[]> {
    const response = await facultyApi.get<ClassWithEnrollment[]>('/faculty/classes');
    return response.data;
  },

  /**
   * Get a specific class by ID
   */
  async getClass(classId: string): Promise<ClassOut> {
    const response = await facultyApi.get<ClassOut>(`/faculty/classes/${classId}`);
    return response.data;
  },

  // ============ Session Management ============

  /**
   * Start a new session for a class
   */
  async startSession(data: SessionStart): Promise<SessionOut> {
    const response = await facultyApi.post<SessionOut>('/faculty/sessions/start', data);
    return response.data;
  },

  /**
   * End current session
   */
  async endSession(sessionId: string): Promise<SessionOut> {
    const response = await facultyApi.post<SessionOut>(`/faculty/sessions/${sessionId}/end`);
    return response.data;
  },

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionOut> {
    const response = await facultyApi.get<SessionOut>(`/faculty/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Get sessions for a class
   */
  async getSessionsByClass(classId: string): Promise<SessionOut[]> {
    const response = await facultyApi.get<SessionOut[]>(`/faculty/classes/${classId}/sessions`);
    return response.data;
  },

  // ============ Slide Control ============

  /**
   * Lock/unlock a slide
   */
  async toggleSlideLock(data: SlideLockToggle): Promise<SlideStateOut> {
    const response = await facultyApi.post<SlideStateOut>('/faculty/slides/lock', data);
    return response.data;
  },

  /**
   * Get current slide states for a session
   */
  async getSlideStates(sessionId: string): Promise<SlideStateOut[]> {
    const response = await facultyApi.get<SlideStateOut[]>(`/faculty/sessions/${sessionId}/slides`);
    return response.data;
  },

  // ============ Student Sync ============

  /**
   * Get student sync status for a session
   */
  async getStudentSyncStatus(sessionId: string): Promise<StudentSyncList> {
    const response = await facultyApi.get<StudentSyncList>(`/faculty/sessions/${sessionId}/students`);
    return response.data;
  },

  // ============ Dashboard ============

  /**
   * Get faculty dashboard data
   */
  async getDashboard(): Promise<FacultyDashboard> {
    const response = await facultyApi.get<FacultyDashboard>('/faculty/dashboard');
    return response.data;
  },

  // ============ Student Bulk Upload (Faculty can upload students for their classes) ============

  /**
   * Bulk upload students (enroll them in a class)
   * Expected columns: email, name
   */
  async bulkUploadStudents(file: File, classId: string): Promise<StudentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('class_id', classId);

    const response = await facultyApi.post<StudentUploadResponse>('/faculty/students/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default facultyApiService;
