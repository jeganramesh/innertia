/**
 * Examination API Service
 * 
 * API calls for the examination and assessment system.
 * Follows Apple-style design principles.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Create axios instance with auth
const examApi = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
examApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================================================
// TYPES
// =============================================================================

export interface ProctoringConfig {
  fullscreen_mandatory: boolean;
  face_detection_required: boolean;
  tab_switch_limit: number;
  violation_threshold: number;
  allow_copy_paste: boolean;
  allow_screenshots: boolean;
  idle_timeout_seconds: number;
  record_snapshots: boolean;
  snapshot_interval_seconds: number;
  multiple_face_detection: boolean;
  phone_detection: boolean;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay';
  options?: Array<{ text: string; is_correct?: boolean }>;
  correct_answer?: string;
  marks: number;
  negative_marks: number;
  section?: string;
  order_index: number;
}

export interface Exam {
  id: string;
  college_id: string;
  title: string;
  description?: string;
  exam_type: 'quiz' | 'midterm' | 'final' | 'practical';
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  course_id?: string;
  exam_template_id?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  total_marks?: number;
  passing_marks?: number;
  is_immediate: boolean;
  max_attempts: number;
  instructions?: string;
  proctoring_config?: ProctoringConfig;
  created_by: string;
  created_at: string;
  updated_at: string;
  question_count: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'graded' | 'terminated';
  total_obtained?: number;
  violation_count: number;
  is_cheating: boolean;
}

export interface ExamStartResponse {
  attempt_id: string;
  exam_id: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  questions: ExamQuestion[];
  started_at: string;
  allow_navigation: boolean;
  allow_review: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  proctoring_config?: ProctoringConfig;
}

export interface Violation {
  id: string;
  exam_submission_id: string;
  timestamp: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high';
  details?: Record<string, any>;
  acknowledged: boolean;
}

export interface ExamTemplate {
  id: string;
  college_id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  total_marks?: number;
  passing_marks?: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_navigation: boolean;
  allow_review: boolean;
  show_result_immediately: boolean;
  proctoring_config?: ProctoringConfig;
  created_by: string;
}

export interface Batch {
  id: string;
  college_id: string;
  name: string;
  academic_year?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

// =============================================================================
// EXAM API CALLS
// =============================================================================

// Exams
export const examApiService = {
  // List exams
  listExams: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    course_id?: string;
    exam_type?: string;
  }) => {
    const response = await examApi.get('/examination/exams', { params });
    return response.data;
  },

  // Get exam by ID
  getExam: async (examId: string) => {
    const response = await examApi.get(`/examination/exams/${examId}`);
    return response.data;
  },

  // Create exam
  createExam: async (data: Partial<Exam>) => {
    const response = await examApi.post('/examination/exams', data);
    return response.data;
  },

  // Update exam
  updateExam: async (examId: string, data: Partial<Exam>) => {
    const response = await examApi.patch(`/examination/exams/${examId}`, data);
    return response.data;
  },

  // Delete exam
  deleteExam: async (examId: string) => {
    const response = await examApi.delete(`/examination/exams/${examId}`);
    return response.data;
  },

  // Publish exam
  publishExam: async (examId: string) => {
    const response = await examApi.post(`/examination/exams/${examId}/publish`);
    return response.data;
  },

  // Cancel exam
  cancelExam: async (examId: string) => {
    const response = await examApi.post(`/examination/exams/${examId}/cancel`);
    return response.data;
  },

  // Create exam with questions
  createExamWithQuestions: async (data: Partial<Exam>, questions?: Partial<ExamQuestion>[]) => {
    const response = await examApi.post('/examination/exams', { ...data, questions });
    return response.data;
  },

  // Bulk add questions to exam
  addExamQuestions: async (examId: string, questions: Partial<ExamQuestion>[]) => {
    const response = await examApi.post(`/examination/exams/${examId}/questions/bulk`, { questions });
    return response.data;
  },

  // Get exam questions
  getExamQuestions: async (examId: string) => {
    const response = await examApi.get(`/examination/exams/${examId}/questions`);
    return response.data;
  },

  // Add question to exam
  addExamQuestion: async (examId: string, data: Partial<ExamQuestion>) => {
    const response = await examApi.post(`/examination/exams/${examId}/questions`, data);
    return response.data;
  },

  // Update exam question
  updateExamQuestion: async (questionId: string, data: Partial<ExamQuestion>) => {
    const response = await examApi.patch(`/examination/exams/questions/${questionId}`, data);
    return response.data;
  },

  // Delete exam question
  deleteExamQuestion: async (questionId: string) => {
    const response = await examApi.delete(`/examination/exams/questions/${questionId}`);
    return response.data;
  },

  // Start exam
  startExam: async (examId: string, data?: {
    device_fingerprint?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<ExamStartResponse> => {
    const response = await examApi.post(`/examination/exams/${examId}/start`, data || {});
    return response.data;
  },

  // Get attempt questions
  getAttemptQuestions: async (attemptId: string) => {
    const response = await examApi.get(`/examination/exams/attempts/${attemptId}/questions`);
    return response.data;
  },

  // Save answers (auto-save)
  saveExamAnswers: async (attemptId: string, answers: Record<string, any>) => {
    const response = await examApi.post(`/examination/exams/attempts/${attemptId}/save`, { answers });
    return response.data;
  },

  // Submit exam
  submitExam: async (attemptId: string, answers: Record<string, any>): Promise<ExamAttempt> => {
    const response = await examApi.post(`/examination/exams/attempts/${attemptId}/submit`, { answers });
    return response.data;
  },

  // Get attempt status
  getAttemptStatus: async (attemptId: string) => {
    const response = await examApi.get(`/examination/exams/attempts/${attemptId}/status`);
    return response.data;
  },

  // Report violation
  reportViolation: async (attemptId: string, data: {
    violation_type: string;
    severity: string;
    details?: Record<string, any>;
  }) => {
    const response = await examApi.post(`/examination/exams/attempts/${attemptId}/violation`, data);
    return response.data;
  },

  // Get exam results
  getExamResults: async (examId: string) => {
    const response = await examApi.get(`/examination/exams/${examId}/results`);
    return response.data;
  },

  // Get active students (for faculty monitoring)
  getActiveStudents: async (examId: string) => {
    const response = await examApi.get(`/examination/exams/${examId}/active-students`);
    return response.data;
  },

  // Terminate student attempt
  terminateStudent: async (examId: string, studentId: string) => {
    const response = await examApi.post(`/examination/exams/${examId}/terminate-student/${studentId}`);
    return response.data;
  },

  // Get monitoring events
  getMonitoringEvents: async (examId: string, limit?: number) => {
    const response = await examApi.get(`/examination/exams/${examId}/monitoring-events`, {
      params: { limit },
    });
    return response.data;
  },
};

// Exam Templates
export const examTemplateApi = {
  listTemplates: async () => {
    const response = await examApi.get('/examination/exam-templates');
    return response.data;
  },

  getTemplate: async (templateId: string) => {
    const response = await examApi.get(`/examination/exam-templates/${templateId}`);
    return response.data;
  },

  createTemplate: async (data: Partial<ExamTemplate>) => {
    const response = await examApi.post('/examination/exam-templates', data);
    return response.data;
  },

  updateTemplate: async (templateId: string, data: Partial<ExamTemplate>) => {
    const response = await examApi.patch(`/examination/exam-templates/${templateId}`, data);
    return response.data;
  },

  deleteTemplate: async (templateId: string) => {
    const response = await examApi.delete(`/examination/exam-templates/${templateId}`);
    return response.data;
  },
};

// Batches
export const batchApi = {
  listBatches: async (isActive?: boolean) => {
    const response = await examApi.get('/examination/batches', {
      params: { is_active: isActive },
    });
    return response.data;
  },

  getBatch: async (batchId: string) => {
    const response = await examApi.get(`/examination/batches/${batchId}`);
    return response.data;
  },

  createBatch: async (data: Partial<Batch>) => {
    const response = await examApi.post('/examination/batches', data);
    return response.data;
  },

  updateBatch: async (batchId: string, data: Partial<Batch>) => {
    const response = await examApi.patch(`/examination/batches/${batchId}`, data);
    return response.data;
  },
};

// Violations
export const violationApi = {
  listViolations: async (params?: {
    page?: number;
    limit?: number;
    exam_id?: string;
    acknowledged?: boolean;
    severity?: string;
  }) => {
    const response = await examApi.get('/examination/violations', { params });
    return response.data;
  },

  acknowledgeViolation: async (violationId: string, acknowledged: boolean) => {
    const response = await examApi.patch(`/examination/violations/${violationId}/acknowledge`, {
      acknowledged,
    });
    return response.data;
  },

  bulkAcknowledge: async (violationIds: string[], acknowledged: boolean) => {
    const response = await examApi.post('/examination/violations/bulk-acknowledge', {
      violation_ids: violationIds,
      acknowledged,
    });
    return response.data;
  },
};

// Analytics
export const analyticsApi = {
  getDepartmentProgress: async (departmentId: string) => {
    const response = await examApi.get(`/examination/analytics/department/${departmentId}/progress`);
    return response.data;
  },

  listStudentAnalytics: async (params?: {
    page?: number;
    limit?: number;
    department_id?: string;
    batch_id?: string;
  }) => {
    const response = await examApi.get('/examination/analytics/students', { params });
    return response.data;
  },

  getStudentDetailedAnalytics: async (studentId: string) => {
    const response = await examApi.get(`/examination/analytics/students/${studentId}/detailed`);
    return response.data;
  },

  getQuestionHeatmap: async (examId: string) => {
    const response = await examApi.get(`/examination/analytics/exams/${examId}/heatmap`);
    return response.data;
  },
};

// Student exams
export const studentExamApi = {
  listAvailableExams: async () => {
    const response = await examApi.get('/examination/student/exams');
    return response.data;
  },

  listMyAttempts: async (examId: string) => {
    const response = await examApi.get(`/examination/student/exams/${examId}/attempts`);
    return response.data;
  },
};

export default examApiService;
