// Admin Types and Interfaces

export type AdminRole = 'admin';

export interface AdminStats {
  totalUsers: number;
  totalFaculties: number;
  totalStudents: number;
  activeSessions: number;
  totalClasses: number;
  averageAttendance: number;
  violationCount: number;
}

export interface SystemConfig {
  attendanceThreshold: number;
  violationPenalty: number;
  slideLockDefault: boolean;
  aiEnabled: boolean;
  tokenExpiry: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface UserManagementItem {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'faculty' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface ClassManagementItem {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  facultyName: string;
  studentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface SessionOverviewItem {
  id: string;
  className: string;
  facultyName: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'terminated';
  attendeeCount: number;
  attendanceRate: number;
}
