/**
 * Desktop Examination API Service
 * 
 * Simplified API for Electron desktop app:
 * - Live monitoring
 * - IP restrictions
 * - Real-time settings
 * - Desktop proctoring
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

const desktopApi = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: { 'Content-Type': 'application/json' },
});

desktopApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================================================
// TYPES
// =============================================================================

export interface SimplifiedProctoringConfig {
  enabled: boolean;
  fullscreen_mandatory: boolean;
  prevent_minimize: boolean;
  prevent_resize: boolean;
  always_on_top: boolean;
  block_copy_paste: boolean;
  block_right_click: boolean;
  block_dev_tools: boolean;
  block_print_screen: boolean;
  tab_switch_limit: number;
  tab_switch_action: 'warn' | 'block' | 'submit';
  detect_window_blur: boolean;
  auto_save_interval_seconds: number;
  idle_timeout_seconds: number;
  idle_action: 'warn' | 'submit';
}

export interface IPRestrictionConfig {
  enabled: boolean;
  allowed_ips: string[];
  allowed_ranges: string[];
  blocked_ips: string[];
  allow_localhost: boolean;
  check_x_forwarded_for: boolean;
}

export interface LiveExamSettings {
  is_paused: boolean;
  pause_message?: string;
  extend_time_minutes: number;
  broadcast_message?: string;
  allow_early_submit: boolean;
  force_submit_at_deadline: boolean;
  show_time_warning_at_minutes: number;
  disabled_students: string[];
}

export interface StudentLiveStatus {
  student_id: string;
  student_name: string;
  student_email: string;
  is_online: boolean;
  last_seen_at: string;
  connection_quality: 'good' | 'fair' | 'poor';
  status: 'in_progress' | 'submitted' | 'paused' | 'disconnected';
  questions_answered: number;
  total_questions: number;
  progress_percentage: number;
  started_at: string;
  time_spent_minutes: number;
  time_remaining_minutes: number;
  last_answer_saved_at?: string;
  tab_switch_count: number;
  warning_count: number;
  platform?: string;
  screen_resolution?: string;
  ip_address?: string;
  is_ip_allowed: boolean;
}

export interface LiveMonitoringSnapshot {
  exam_id: string;
  exam_title: string;
  generated_at: string;
  total_students: number;
  active_students: number;
  submitted_students: number;
  disconnected_students: number;
  avg_time_remaining_minutes: number;
  min_time_remaining_minutes: number;
  total_tab_switches: number;
  total_warnings_issued: number;
  current_settings: LiveExamSettings;
  ip_restrictions: IPRestrictionConfig;
  students: StudentLiveStatus[];
}

export interface MonitoringEvent {
  event_id: string;
  timestamp: string;
  event_type: 'tab_switch' | 'disconnect' | 'reconnect' | 'warning' | 'submit' | 'pause' | 'resume';
  severity: 'info' | 'warning' | 'critical';
  student_id: string;
  student_name: string;
  description: string;
  details?: Record<string, any>;
  acknowledged: boolean;
}

export interface DesktopExam {
  id: string;
  college_id: string;
  title: string;
  description?: string;
  exam_type: 'mcq' | 'coding' | 'mixed';
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  scheduled_at?: string;
  scheduled_end_at?: string;
  duration_minutes: number;
  timezone: string;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  instructions?: string;
  welcome_message?: string;
  completion_message?: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_navigation: boolean;
  allow_review: boolean;
  show_result_immediately: boolean;
  require_password: boolean;
  proctoring_enabled: boolean;
  proctoring_config: SimplifiedProctoringConfig;
  ip_restrictions: IPRestrictionConfig;
  created_by: string;
  created_at: string;
  updated_at: string;
  question_count: number;
  enrolled_count: number;
  submitted_count: number;
}

export interface ProctorActionResponse {
  success: boolean;
  action_type: string;
  student_id: string;
  student_name: string;
  message: string;
  timestamp: string;
}

// =============================================================================
// DESKTOP EXAM API SERVICE
// =============================================================================

export const examDesktopApiService = {
  // ==========================================================================
  // Exam CRUD
  // ==========================================================================
  
  createExam: async (data: Partial<DesktopExam>): Promise<DesktopExam> => {
    const response = await desktopApi.post('/examination/desktop/exams', data);
    return response.data;
  },

  listExams: async (params?: { status?: string }): Promise<DesktopExam[]> => {
    const response = await desktopApi.get('/examination/desktop/exams', { params });
    return response.data;
  },

  getExam: async (examId: string): Promise<DesktopExam> => {
    const response = await desktopApi.get(`/examination/desktop/exams/${examId}`);
    return response.data;
  },

  updateExamSettings: async (examId: string, settings: {
    proctoring_config?: SimplifiedProctoringConfig;
    ip_restrictions?: IPRestrictionConfig;
  }): Promise<DesktopExam> => {
    const response = await desktopApi.patch(`/examination/desktop/exams/${examId}/settings`, settings);
    return response.data;
  },

  // ==========================================================================
  // Live Monitoring
  // ==========================================================================
  
  getLiveMonitoring: async (examId: string): Promise<LiveMonitoringSnapshot> => {
    const response = await desktopApi.get(`/examination/desktop/exams/${examId}/live-monitoring`);
    return response.data;
  },

  getLiveSettings: async (examId: string): Promise<LiveExamSettings> => {
    const response = await desktopApi.get(`/examination/desktop/exams/${examId}/live-settings`);
    return response.data;
  },

  updateLiveSettings: async (examId: string, settings: Partial<LiveExamSettings>): Promise<LiveExamSettings> => {
    const response = await desktopApi.post(`/examination/desktop/exams/${examId}/live-settings`, settings);
    return response.data;
  },

  // ==========================================================================
  // Proctor Actions
  // ==========================================================================
  
  sendWarning: async (examId: string, studentId: string, message: string): Promise<ProctorActionResponse> => {
    const response = await desktopApi.post(`/examination/desktop/exams/${examId}/proctor-actions`, {
      action_type: 'warn',
      student_id: studentId,
      reason: 'Proctor warning',
      warning_message: message
    });
    return response.data;
  },

  extendTime: async (examId: string, studentId: string, minutes: number, reason: string): Promise<ProctorActionResponse> => {
    const response = await desktopApi.post(`/examination/desktop/exams/${examId}/proctor-actions`, {
      action_type: 'extend_time',
      student_id: studentId,
      reason,
      additional_minutes: minutes
    });
    return response.data;
  },

  forceSubmit: async (examId: string, studentId: string, reason: string): Promise<ProctorActionResponse> => {
    const response = await desktopApi.post(`/examination/desktop/exams/${examId}/proctor-actions`, {
      action_type: 'force_submit',
      student_id: studentId,
      reason
    });
    return response.data;
  },

  kickStudent: async (examId: string, studentId: string, reason: string): Promise<ProctorActionResponse> => {
    const response = await desktopApi.post(`/examination/desktop/exams/${examId}/proctor-actions`, {
      action_type: 'kick',
      student_id: studentId,
      reason
    });
    return response.data;
  },

  broadcastMessage: async (examId: string, message: string): Promise<void> => {
    await desktopApi.post(`/examination/desktop/exams/${examId}/live-settings`, {
      broadcast_message: message
    });
  },

  pauseExam: async (examId: string, message: string): Promise<void> => {
    await desktopApi.post(`/examination/desktop/exams/${examId}/live-settings`, {
      is_paused: true,
      pause_message: message
    });
  },

  resumeExam: async (examId: string): Promise<void> => {
    await desktopApi.post(`/examination/desktop/exams/${examId}/live-settings`, {
      is_paused: false
    });
  },

  // ==========================================================================
  // IP Management
  // ==========================================================================
  
  updateIPRestrictions: async (examId: string, config: IPRestrictionConfig): Promise<IPRestrictionConfig> => {
    const response = await desktopApi.post(`/examination/desktop/exams/${examId}/ip-restrictions`, config);
    return response.data;
  },

  getIPLogs: async (examId: string, limit: number = 100): Promise<any[]> => {
    const response = await desktopApi.get(`/examination/desktop/exams/${examId}/ip-logs`, {
      params: { limit }
    });
    return response.data;
  },

  // ==========================================================================
  // Polling for Live Updates
  // ==========================================================================
  
  startMonitoringPolling: (examId: string, callback: (data: LiveMonitoringSnapshot) => void, intervalMs: number = 5000) => {
    const intervalId = setInterval(async () => {
      try {
        const data = await examDesktopApiService.getLiveMonitoring(examId);
        callback(data);
      } catch (error) {
        console.error('Monitoring poll error:', error);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }
};

export default examDesktopApiService;
