// Faculty Types and Interfaces

export type FacultyRole = 'faculty';

export interface FacultyClass {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  sessionCount: number;
  lastSession?: string;
  status: 'active' | 'archived';
}

export interface FacultySession {
  id: string;
  classId: string;
  className: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'completed';
  attendeeCount: number;
  syncedCount: number;
  focusPercentage: number;
  violationCount: number;
  currentSlide: number;
  totalSlides: number;
  slideLocked: boolean;
}

export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  present: boolean;
  focusPercentage: number;
  violations: number;
  joinTime?: string;
}

export interface SlideInfo {
  currentSlide: number;
  totalSlides: number;
  slideLocked: boolean;
}

export interface FacultyStats {
  totalClasses: number;
  activeClasses: number;
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
}

export interface SessionNote {
  id: string;
  content: string;
  slideNumber: number;
  createdAt: string;
}
