import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  Class,
  Session,
  CreateClassDto,
  UpdateClassDto,
  UploadFile,
  FacultyStats,
  SessionReport,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  UploadedFile,
} from '../types';
import { mockClasses, mockSessions, mockStats, mockUploadFiles, mockSessionReport } from './mockData';

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Chunk size for large file uploads (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024;

class ApiService {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Classes API
  async getClasses(filters?: FilterOptions): Promise<ApiResponse<Class[]>> {
    await delay(500);
    return { data: mockClasses };
  }

  async getClassById(id: string): Promise<ApiResponse<Class>> {
    await delay(500);
    const cls = mockClasses.find(c => c.id === id);
    if (!cls) throw new Error('Class not found');
    return { data: cls };
  }

  async createClass(data: CreateClassDto): Promise<ApiResponse<Class>> {
    await delay(800);
    const newClass: Class = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      lastSession: new Date(),
      studentCount: data.studentCount || 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { data: newClass };
  }

  async updateClass(id: string, data: UpdateClassDto): Promise<ApiResponse<Class>> {
    await delay(600);
    const cls = mockClasses.find(c => c.id === id);
    if (!cls) throw new Error('Class not found');
    return { data: { ...cls, ...data, updatedAt: new Date() } as Class };
  }

  async deleteClass(id: string): Promise<ApiResponse<void>> {
    await delay(500);
    return { data: undefined };
  }

  // Sessions API
  async getRecentSessions(limit: number = 10): Promise<ApiResponse<Session[]>> {
    await delay(500);
    return { data: mockSessions.slice(0, limit) };
  }

  async getSessionById(id: string): Promise<ApiResponse<Session>> {
    await delay(400);
    const session = mockSessions.find(s => s.id === id);
    if (!session) throw new Error('Session not found');
    return { data: session };
  }

  async getSessionReport(sessionId: string): Promise<ApiResponse<SessionReport>> {
    await delay(700);
    return { data: mockSessionReport };
  }

  async getSessionsByClass(classId: string): Promise<ApiResponse<Session[]>> {
    await delay(500);
    return { data: mockSessions.filter(s => s.classId === classId) };
  }

  // File Upload API - Chunked upload support
  async initiateUpload(
    fileName: string,
    fileSize: number,
    fileType: string,
    classId?: string
  ): Promise<ApiResponse<{ uploadId: string; chunks: number }>> {
    await delay(300);
    const uploadId = Math.random().toString(36).substr(2, 9);
    const chunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    return {
      data: {
        uploadId,
        chunks,
      },
    };
  }

  async uploadChunk(
    uploadId: string,
    chunk: Blob,
    chunkIndex: number,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ success: boolean }>> {
    // Simulate chunk upload progress
    for (let i = 0; i <= 100; i += 25) {
      if (onProgress) onProgress(i);
      await delay(100);
    }

    await delay(200);
    return { data: { success: true } };
  }

  async completeUpload(
    uploadId: string
  ): Promise<ApiResponse<UploadedFile>> {
    await delay(500);
    
    return {
      data: {
        id: uploadId,
        name: 'Uploaded File',
        type: 'pdf',
        size: 0,
        url: '#',
        uploadedAt: new Date(),
        status: 'completed',
        progress: 100,
      } as UploadedFile,
    };
  }

  async uploadFile(
    file: File,
    classId?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<UploadFile>> {
    // Check if file should be chunked (> 10MB)
    const SHOULD_CHUNK = file.size > 10 * 1024 * 1024;

    if (SHOULD_CHUNK) {
      // Use chunked upload for large files
      const { uploadId, chunks } = await this.initiateUpload(
        file.name,
        file.size,
        file.type,
        classId
      );

      // Upload chunks
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        await this.uploadChunk(uploadId, chunk, i, (chunkProgress) => {
          if (onProgress) {
            const overallProgress = Math.round(((i + chunkProgress / 100) / chunks) * 100);
            onProgress(overallProgress);
          }
        });
      }

      // Complete upload
      const result = await this.completeUpload(uploadId);
      return result;
    }

    // Simple upload for small files
    await delay(300);

    // Simulate progress
    for (let i = 0; i <= 100; i += 20) {
      if (onProgress) onProgress(i);
      await delay(200);
    }

    const newFile: UploadFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.name.split('.').pop()?.toLowerCase() as any || 'pdf',
      size: file.size,
      url: '#',
      uploadedAt: new Date(),
      classId,
    };

    return { data: newFile };
  }

  async getUploadStatus(
    uploadId: string
  ): Promise<ApiResponse<{ status: string; progress: number }>> {
    await delay(200);
    return {
      data: {
        status: 'processing',
        progress: 75,
      },
    };
  }

  async resumeUpload(
    uploadId: string
  ): Promise<ApiResponse<{ chunks: number; uploadedChunks: number[] }>> {
    await delay(300);
    return {
      data: {
        chunks: 10,
        uploadedChunks: [0, 1, 2, 3, 4],
      },
    };
  }

  async getFilesByClass(classId: string): Promise<ApiResponse<UploadFile[]>> {
    await delay(400);
    return { data: mockUploadFiles.filter(f => f.classId === classId) };
  }

  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    await delay(400);
    return { data: undefined };
  }

  // Stats API
  async getFacultyStats(): Promise<ApiResponse<FacultyStats>> {
    await delay(300);
    return { data: mockStats };
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    await delay(200);
    return { data: { status: 'ok' } };
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('An unknown error occurred');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export individual methods for convenience
export const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getRecentSessions,
  getSessionById,
  getSessionReport,
  getSessionsByClass,
  uploadFile,
  initiateUpload,
  uploadChunk,
  completeUpload,
  getUploadStatus,
  resumeUpload,
  getFilesByClass,
  deleteFile,
  getFacultyStats,
  healthCheck,
} = apiService;

export const { client: api } = apiService;
