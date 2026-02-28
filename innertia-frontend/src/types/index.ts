// Core Types for Innertia Faculty Dashboard

export type ClassStatus = 'active' | 'archived';
export type SessionStatus = 'completed' | 'in_progress' | 'scheduled';
export type FileType = 'ppt' | 'pdf' | 'docx' | 'xlsx';

export type UploadStatus = 'uploading' | 'processing' | 'completed' | 'error' | 'queued';

export type UserRole = 'platform_admin' | 'college_admin' | 'staff' | 'faculty' | 'trainer' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  full_name: string;
  role: UserRole;
  college_id?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFeatures {
  features: string[];
  college_id: string | null;
  role: UserRole;
}

export interface AIFeatures {
  textExtracted: boolean;
  embeddingsGenerated: boolean;
  questionsGenerated: boolean;
  summaryGenerated: boolean;
  keywordsExtracted: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  url: string;
  uploadedAt: Date | string;
  classId?: string;
  status: UploadStatus;
  progress: number;
  aiFeatures?: AIFeatures;
  processingDetails?: {
    slidesProcessed?: number;
    totalSlides?: number;
    currentStep?: string;
    estimatedTimeRemaining?: number;
  };
}

export interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface FacultyStats {
  totalClasses: number;
  activeClasses: number;
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
  badge?: number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface FilterOptions {
  search?: string;
  status?: ClassStatus;
  subject?: string;
  sortBy?: 'name' | 'lastSession' | 'studentCount';
  sortOrder?: 'asc' | 'desc';
}

export interface SessionReport {
  sessionId: string;
  className: string;
  date: Date | string;
  duration: number; // in minutes
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
