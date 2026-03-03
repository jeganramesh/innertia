// Student Types and Interfaces

export type StudentRole = 'student';

export interface StudentClass {
  id: string;
  name: string;
  code: string;
  facultyName: string;
  schedule: string;
  status: 'active' | 'archived';
}

export interface StudentSession {
  id: string;
  classId: string;
  className: string;
  facultyName: string;
  startTime: string;
  status: 'active' | 'completed';
  attendance?: {
    present: boolean;
    percentage: number;
  };
}

export interface StudentNote {
  id: string;
  sessionId: string;
  className: string;
  content: string;
  slideNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIQuestion {
  id: string;
  question: string;
  answer?: string;
  slideContext?: number;
  status: 'pending' | 'answered' | 'blocked';
  createdAt: string;
}

export interface StudentAttendanceRecord {
  id: string;
  classId: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  percentage: number;
}

export interface StudentStats {
  totalClasses: number;
  sessionsAttended: number;
  sessionsMissed: number;
  averageAttendance: number;
}
