/**
 * Enhanced Examination API Service
 * 
 * Extended API calls for professional examination features:
 * - Advanced question types (coding, fill-blanks, matching)
 * - Enhanced proctoring
 * - Section management
 * - Comprehensive analytics
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Create axios instance with auth
const examEnhancedApi = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
examEnhancedApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================================================
// TYPES - ENHANCED
// =============================================================================

export interface CodingQuestionConfig {
  language: 'python' | 'javascript' | 'java' | 'cpp';
  starter_code?: string;
  test_cases: Array<{
    input: string;
    expected_output: string;
  }>;
  time_limit_seconds: number;
  memory_limit_mb: number;
  allow_multiple_solutions: boolean;
}

export interface FillBlanksQuestionConfig {
  text_with_blanks: string;
  blanks: Array<{
    id: string;
    correct_answer: string;
    marks: number;
  }>;
  case_sensitive: boolean;
  allow_partial_credit: boolean;
}

export interface MatchingQuestionConfig {
  left_items: Array<{ id: string; text: string }>;
  right_items: Array<{ id: string; text: string }>;
  correct_pairs: Array<{ left: string; right: string }>;
  allow_multiple_matches: boolean;
}

export interface QuestionMedia {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail_url?: string;
  caption?: string;
}

export interface EnhancedProctoringConfig {
  enabled: boolean;
  fullscreen_mandatory: boolean;
  tab_switch_limit: number;
  violation_threshold: number;
  face_detection_required: boolean;
  face_detection_interval: number;
  multiple_face_detection: boolean;
  face_not_visible_limit: number;
  phone_detection: boolean;
  book_detection: boolean;
  person_detection: boolean;
  record_screen: boolean;
  screenshot_interval: number;
  screen_capture_on_violation: boolean;
  allow_copy_paste: boolean;
  allow_right_click: boolean;
  allow_keyboard_shortcuts: boolean;
  record_audio: boolean;
  noise_detection: boolean;
  require_id_verification: boolean;
  id_verification_before_start: boolean;
  require_room_scan: boolean;
  room_scan_before_start: boolean;
}

export interface EnhancedExam {
  id: string;
  college_id: string;
  title: string;
  description?: string;
  exam_type: 'mcq' | 'coding' | 'mixed';
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  course_id?: string;
  exam_template_id?: string;
  
  // Scheduling
  scheduled_at?: string;
  scheduled_end_at?: string;
  timezone: string;
  is_immediate: boolean;
  
  // Duration and attempts
  duration_minutes?: number;
  max_attempts: number;
  allow_late_submission: boolean;
  late_submission_penalty?: number;
  
  // Marks
  total_marks?: number;
  passing_marks?: number;
  
  // Instructions
  instructions?: string;
  welcome_message?: string;
  completion_message?: string;
  
  // Settings
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_navigation: boolean;
  allow_review: boolean;
  show_result_immediately: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
  
  // Proctoring
  proctoring_enabled: boolean;
  proctoring_config?: EnhancedProctoringConfig;
  
  // Access
  require_password: boolean;
  allowed_ip_ranges?: string[];
  
  // Notifications
  notify_students_on_publish: boolean;
  reminder_before_minutes?: number;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Computed
  question_count: number;
  section_count: number;
  registered_students: number;
  submitted_count: number;
}

export interface EnhancedExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay' | 'coding' | 'fill_blanks' | 'matching';
  options?: Array<{ text: string; is_correct?: boolean }>;
  correct_answer?: string;
  marks: number;
  negative_marks: number;
  section?: string;
  order_index: number;
  
  // Enhanced fields
  media?: QuestionMedia[];
  explanation?: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  
  // Advanced configs
  coding_config?: CodingQuestionConfig;
  fill_blanks_config?: FillBlanksQuestionConfig;
  matching_config?: MatchingQuestionConfig;
  
  created_at: string;
  updated_at: string;
}

export interface ExamSection {
  id: string;
  exam_id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  order_index: number;
  instructions?: string;
  shuffle_questions: boolean;
  question_count: number;
  total_marks: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedExamStartResponse {
  attempt_id: string;
  exam_id: string;
  exam_title: string;
  duration_minutes: number;
  started_at: string;
  ends_at: string;
  total_marks: number;
  passing_marks: number;
  question_count: number;
  sections: ExamSection[];
  questions: EnhancedExamQuestion[];
  allow_navigation: boolean;
  allow_review: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  proctoring_enabled: boolean;
  proctoring_config?: EnhancedProctoringConfig;
  welcome_message?: string;
  instructions?: string;
}

export interface EnhancedExamAttempt {
  id: string;
  exam_id: string;
  exam_title: string;
  student_id: string;
  student_name: string;
  started_at: string;
  submitted_at?: string;
  completion_time_minutes?: number;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'graded' | 'terminated';
  total_marks: number;
  obtained_marks?: number;
  percentage?: number;
  is_passed?: boolean;
  answers?: Record<string, any>;
  graded_by?: string;
  graded_by_name?: string;
  graded_at?: string;
  grading_notes?: string;
  section_scores?: Array<{
    section_id: string;
    section_name: string;
    marks: number;
    obtained: number;
  }>;
  violation_count: number;
  is_cheating_flagged: boolean;
  proctoring_review_status: 'pending' | 'reviewed' | 'cleared';
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  question_type: string;
  marks: number;
  attempts_count: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  accuracy_rate: number;
  avg_time_seconds?: number;
  difficulty_index: number;
  discrimination_index: number;
  option_distribution?: Record<string, number>;
}

export interface ExamAnalytics {
  exam_id: string;
  exam_title: string;
  total_registered: number;
  total_attempted: number;
  total_submitted: number;
  completion_rate: number;
  avg_score: number;
  median_score: number;
  max_score: number;
  min_score: number;
  std_deviation: number;
  passing_count: number;
  failing_count: number;
  pass_rate: number;
  avg_completion_time_minutes: number;
  on_time_submissions: number;
  late_submissions: number;
  total_violations: number;
  avg_violations_per_student: number;
  students_with_violations: number;
  section_analytics: Array<{
    section_id: string;
    section_name: string;
    total_marks: number;
    avg_score: number;
    max_score: number;
    min_score: number;
    avg_time_minutes: number;
    question_count: number;
  }>;
  question_analytics: QuestionAnalytics[];
  score_distribution: Record<string, number>;
  time_distribution: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  obtained_marks: number;
  percentage: number;
  completion_time_minutes: number;
  submitted_at: string;
}

export interface ExamLeaderboard {
  exam_id: string;
  exam_title: string;
  total_participants: number;
  entries: LeaderboardEntry[];
  user_rank?: number;
  user_entry?: LeaderboardEntry;
}

export interface ProctoringEvent {
  id: string;
  attempt_id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
  screenshot_url?: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface LiveMonitoringData {
  exam_id: string;
  exam_title: string;
  active_students: Array<{
    student_id: string;
    student_name: string;
    started_at: string;
    violation_count: number;
    status: string;
    ip_address?: string;
  }>;
  active_count: number;
  recent_violations: Array<{
    id: string;
    student_name: string;
    violation_type: string;
    severity: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
  total_violations: number;
}

// =============================================================================
// ENHANCED EXAM API SERVICE
// =============================================================================

export const examEnhancedApiService = {
  // ==========================================================================
  // Enhanced Exam CRUD
  // ==========================================================================
  
  createEnhancedExam: async (data: Partial<EnhancedExam>): Promise<EnhancedExam> => {
    const response = await examEnhancedApi.post('/examination/enhanced/exams', data);
    return response.data;
  },

  listEnhancedExams: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    course_id?: string;
    search?: string;
  }): Promise<EnhancedExam[]> => {
    const response = await examEnhancedApi.get('/examination/enhanced/exams', { params });
    return response.data;
  },

  getEnhancedExam: async (examId: string): Promise<EnhancedExam> => {
    const response = await examEnhancedApi.get(`/examination/enhanced/exams/${examId}`);
    return response.data;
  },

  updateEnhancedExam: async (examId: string, data: Partial<EnhancedExam>): Promise<EnhancedExam> => {
    const response = await examEnhancedApi.patch(`/examination/enhanced/exams/${examId}`, data);
    return response.data;
  },

  deleteEnhancedExam: async (examId: string): Promise<void> => {
    await examEnhancedApi.delete(`/examination/enhanced/exams/${examId}`);
  },

  // ==========================================================================
  // Enhanced Question Management
  // ==========================================================================
  
  createEnhancedQuestion: async (examId: string, data: Partial<EnhancedExamQuestion>): Promise<EnhancedExamQuestion> => {
    const response = await examEnhancedApi.post(`/examination/enhanced/exams/${examId}/questions/enhanced`, data);
    return response.data;
  },

  bulkImportQuestions: async (examId: string, questions: Partial<EnhancedExamQuestion>[]): Promise<{
    success: boolean;
    message: string;
    processed_count: number;
    error_count: number;
    errors?: any[];
  }> => {
    const response = await examEnhancedApi.post(`/examination/enhanced/exams/${examId}/questions/import`, {
      format: 'json',
      questions
    });
    return response.data;
  },

  // ==========================================================================
  // Enhanced Exam Attempts
  // ==========================================================================
  
  startEnhancedExam: async (examId: string, deviceInfo?: {
    device_fingerprint?: string;
    ip_address?: string;
    user_agent?: string;
    screen_resolution?: string;
    os_info?: string;
    browser_info?: string;
    password?: string;
  }): Promise<EnhancedExamStartResponse> => {
    const response = await examEnhancedApi.post(`/examination/enhanced/exams/${examId}/start-enhanced`, deviceInfo || {});
    return response.data;
  },

  saveEnhancedProgress: async (attemptId: string, data: {
    answers: Record<string, any>;
    current_section_id?: string;
    time_remaining_seconds?: number;
  }): Promise<{ message: string; attempt_id: string; saved_at: string }> => {
    const response = await examEnhancedApi.post(`/examination/enhanced/attempts/${attemptId}/save-enhanced`, data);
    return response.data;
  },

  submitEnhancedExam: async (attemptId: string, data: {
    answers: Record<string, any>;
    time_spent_seconds: number;
    feedback?: string;
    technical_issues?: string;
  }): Promise<EnhancedExamAttempt> => {
    const response = await examEnhancedApi.post(`/examination/enhanced/attempts/${attemptId}/submit-enhanced`, data);
    return response.data;
  },

  // ==========================================================================
  // Proctoring
  // ==========================================================================
  
  reportProctoringEvent: async (attemptId: string, event: {
    event_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, any>;
    screenshot_url?: string;
  }): Promise<ProctoringEvent> => {
    const response = await examEnhancedApi.post(`/examination/enhanced/attempts/${attemptId}/proctoring/event`, {
      attempt_id: attemptId,
      ...event,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },

  getLiveMonitoringData: async (examId: string): Promise<LiveMonitoringData> => {
    const response = await examEnhancedApi.get(`/examination/enhanced/exams/${examId}/proctoring/live-monitoring`);
    return response.data;
  },

  terminateStudentExam: async (examId: string, studentId: string, reason: string): Promise<{
    message: string;
    attempt_id: string;
    reason: string;
  }> => {
    const response = await examEnhancedApi.post(
      `/examination/enhanced/exams/${examId}/proctoring/terminate/${studentId}?reason=${encodeURIComponent(reason)}`
    );
    return response.data;
  },

  // ==========================================================================
  // Analytics & Reporting
  // ==========================================================================
  
  getExamAnalytics: async (examId: string): Promise<ExamAnalytics> => {
    const response = await examEnhancedApi.get(`/examination/enhanced/exams/${examId}/analytics`);
    return response.data;
  },

  getExamLeaderboard: async (examId: string, limit: number = 50): Promise<ExamLeaderboard> => {
    const response = await examEnhancedApi.get(`/examination/enhanced/exams/${examId}/leaderboard`, {
      params: { limit }
    });
    return response.data;
  },

  getDetailedResults: async (examId: string, attemptId: string): Promise<{
    summary: {
      attempt_id: string;
      exam_id: string;
      exam_title: string;
      total_marks: number;
      obtained_marks: number;
      percentage: number;
      grade: string;
      is_passed: boolean;
      rank?: number;
      total_participants: number;
      percentile?: number;
    };
    question_results: Array<{
      question_id: string;
      question_text: string;
      question_type: string;
      marks: number;
      given_answer: any;
      is_correct: boolean;
      obtained_marks: number;
      correct_answer?: any;
      explanation?: string;
      time_spent_seconds?: number;
    }>;
  }> => {
    const response = await examEnhancedApi.get(`/examination/enhanced/exams/${examId}/results/${attemptId}`);
    return response.data;
  },
};

export default examEnhancedApiService;
