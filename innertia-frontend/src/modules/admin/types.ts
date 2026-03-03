/**
 * Admin Module Types
 * Role-specific type definitions for admin module
 */

import { UserRole } from '../../../types';

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalClasses: number;
  totalSessions: number;
  activeSessions: number;
  last30DaySessions: number;
  usersByRole: Record<UserRole, number>;
  averageAttendanceRate: number;
  totalViolations7Days: number;
}

export interface CollegeManagement {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  totalUsers: number;
  userCounts: Record<UserRole, number>;
}

export interface FeatureToggle {
  id: string;
  collegeId: string;
  featureKey: string;
  isEnabled: boolean;
}

export interface RolePermission {
  id: string;
  collegeId: string;
  role: UserRole;
  featureKey: string;
  isEnabled: boolean;
}
