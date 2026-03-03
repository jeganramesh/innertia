"""
Simplified Examination Schemas for Electron Desktop Application.

This module provides practical schemas for desktop-based examinations:
- Simplified proctoring (no AI/ML features)
- IP-based restrictions
- Live monitoring panel
- Real-time settings control
- Electron app compatibility
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# SIMPLIFIED PROCTORING CONFIG (No AI/ML)
# =============================================================================

class SimplifiedProctoringConfig(BaseModel):
    """Simplified proctoring for desktop Electron app."""
    enabled: bool = Field(True, description="Enable basic proctoring")
    
    # Window management
    fullscreen_mandatory: bool = Field(False, description="Require fullscreen mode")
    prevent_minimize: bool = Field(True, description="Prevent window minimize")
    prevent_resize: bool = Field(True, description="Prevent window resize")
    always_on_top: bool = Field(True, description="Keep exam window on top")
    
    # Input restrictions
    block_copy_paste: bool = Field(True, description="Block copy/paste shortcuts")
    block_right_click: bool = Field(True, description="Block right-click context menu")
    block_dev_tools: bool = Field(True, description="Block DevTools in Electron")
    block_print_screen: bool = Field(True, description="Block print screen key")
    
    # Tab/Application switching
    tab_switch_limit: int = Field(3, description="Tab switches before warning")
    tab_switch_action: str = Field("warn", description="warn|block|submit")
    detect_window_blur: bool = Field(True, description="Detect when window loses focus")
    
    # Auto-save
    auto_save_interval_seconds: int = Field(30, description="Auto-save answers every N seconds")
    
    # Idle detection
    idle_timeout_seconds: int = Field(300, description="Warn after idle seconds")
    idle_action: str = Field("warn", description="warn|submit")


# =============================================================================
# IP RESTRICTIONS
# =============================================================================

class IPRestrictionConfig(BaseModel):
    """IP-based access restrictions."""
    enabled: bool = Field(False, description="Enable IP restrictions")
    allowed_ips: List[str] = Field(default=[], description="List of allowed IP addresses")
    allowed_ranges: List[str] = Field(default=[], description="Allowed CIDR ranges (e.g., 192.168.1.0/24)")
    blocked_ips: List[str] = Field(default=[], description="Explicitly blocked IPs")
    allow_localhost: bool = Field(True, description="Allow localhost/127.0.0.1")
    check_x_forwarded_for: bool = Field(True, description="Check X-Forwarded-For header")


# =============================================================================
# LIVE EXAM SETTINGS (Real-time configurable)
# =============================================================================

class LiveExamSettings(BaseModel):
    """Settings that can be changed during an active exam."""
    # Status control
    is_paused: bool = Field(False, description="Pause all active exams")
    pause_message: Optional[str] = Field(None, description="Message shown when paused")
    
    # Time extensions
    extend_time_minutes: int = Field(0, description="Add time to all active attempts")
    
    # Communication
    broadcast_message: Optional[str] = Field(None, description="Send message to all students")
    
    # Submission control
    allow_early_submit: bool = Field(True, description="Allow students to submit early")
    force_submit_at_deadline: bool = Field(True, description="Auto-submit at deadline")
    
    # Warnings
    show_time_warning_at_minutes: int = Field(5, description="Warn when N minutes remaining")
    
    # Individual student actions
    disabled_students: List[UUID] = Field(default=[], description="Student IDs prevented from continuing")


class LiveExamSettingsUpdate(BaseModel):
    """Update live exam settings."""
    is_paused: Optional[bool] = None
    pause_message: Optional[str] = None
    extend_time_minutes: Optional[int] = None
    broadcast_message: Optional[str] = None
    allow_early_submit: Optional[bool] = None
    show_time_warning_at_minutes: Optional[int] = None


# =============================================================================
# LIVE MONITORING (Practical Desktop Features)
# =============================================================================

class StudentLiveStatus(BaseModel):
    """Real-time status of a student in live monitoring."""
    student_id: UUID
    student_name: str
    student_email: str
    
    # Connection status
    is_online: bool = Field(True, description="Currently connected")
    last_seen_at: datetime
    connection_quality: str = Field("good", description="good|fair|poor")
    
    # Progress
    status: str = Field("in_progress", description="in_progress|submitted|paused|disconnected")
    questions_answered: int = Field(0, description="Number of questions with answers")
    total_questions: int
    progress_percentage: float = Field(0.0, description="0-100 completion percentage")
    
    # Time tracking
    started_at: datetime
    time_spent_minutes: float
    time_remaining_minutes: float
    
    # Activity
    last_answer_saved_at: Optional[datetime] = None
    tab_switch_count: int = Field(0, description="Number of window focus losses")
    warning_count: int = Field(0, description="Warnings issued")
    
    # Device info (basic, no fingerprinting)
    platform: Optional[str] = Field(None, description="win32|darwin|linux")
    screen_resolution: Optional[str] = None
    
    # IP info
    ip_address: Optional[str] = None
    is_ip_allowed: bool = Field(True, description="IP passes restrictions")


class LiveMonitoringSnapshot(BaseModel):
    """Complete snapshot of exam monitoring state."""
    exam_id: UUID
    exam_title: str
    generated_at: datetime
    
    # Overall stats
    total_students: int
    active_students: int
    submitted_students: int
    disconnected_students: int
    
    # Time stats
    avg_time_remaining_minutes: float
    min_time_remaining_minutes: float
    
    # Activity
    total_tab_switches: int
    total_warnings_issued: int
    
    # Settings
    current_settings: LiveExamSettings
    ip_restrictions: IPRestrictionConfig
    
    # Student list
    students: List[StudentLiveStatus]


class MonitoringEvent(BaseModel):
    """Events shown in monitoring panel."""
    event_id: UUID
    timestamp: datetime
    event_type: str = Field(..., description="tab_switch|disconnect|reconnect|warning|submit|pause|resume")
    severity: str = Field("info", description="info|warning|critical")
    
    student_id: UUID
    student_name: str
    
    description: str
    details: Optional[Dict[str, Any]] = None
    acknowledged: bool = Field(False, description="Event reviewed by proctor")


# =============================================================================
# SIMPLIFIED EXAM SCHEMAS
# =============================================================================

class SimplifiedExamCreate(BaseModel):
    """Create exam optimized for Electron desktop app."""
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    exam_type: str = Field("mcq", description="mcq|coding|mixed")
    course_id: Optional[UUID] = None
    
    # Timing
    scheduled_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    duration_minutes: int = Field(..., ge=1, description="Exam duration")
    timezone: str = Field("UTC", description="IANA timezone identifier")
    
    # Marks
    total_marks: int = Field(..., ge=1)
    passing_marks: int = Field(..., ge=0)
    
    # Attempts
    max_attempts: int = Field(1, ge=1)
    
    # Instructions
    instructions: Optional[str] = None
    welcome_message: Optional[str] = Field("Welcome to the exam. Good luck!")
    completion_message: Optional[str] = Field("Exam completed. Thank you!")
    
    # Question settings
    shuffle_questions: bool = Field(False)
    shuffle_options: bool = Field(False)
    allow_navigation: bool = Field(True, description="Allow moving between questions")
    allow_review: bool = Field(True, description="Allow reviewing answers before submit")
    show_result_immediately: bool = Field(False)
    
    # Security
    require_password: bool = Field(False)
    password: Optional[str] = None
    
    # Proctoring (simplified)
    proctoring_enabled: bool = Field(True)
    proctoring_config: SimplifiedProctoringConfig = Field(default_factory=SimplifiedProctoringConfig)
    
    # IP Restrictions
    ip_restrictions: IPRestrictionConfig = Field(default_factory=IPRestrictionConfig)
    
    # Notifications
    notify_on_start: bool = Field(True)
    notify_on_submit: bool = Field(True)


class SimplifiedExamResponse(BaseModel):
    """Exam response for desktop app."""
    id: UUID
    college_id: UUID
    title: str
    description: Optional[str]
    exam_type: str
    status: str
    
    scheduled_at: Optional[datetime]
    scheduled_end_at: Optional[datetime]
    duration_minutes: int
    timezone: str
    
    total_marks: int
    passing_marks: int
    max_attempts: int
    
    instructions: Optional[str]
    welcome_message: Optional[str]
    completion_message: Optional[str]
    
    shuffle_questions: bool
    shuffle_options: bool
    allow_navigation: bool
    allow_review: bool
    show_result_immediately: bool
    
    require_password: bool
    proctoring_enabled: bool
    proctoring_config: SimplifiedProctoringConfig
    ip_restrictions: IPRestrictionConfig
    
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    # Computed
    question_count: int = 0
    enrolled_count: int = 0
    submitted_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ELECTRON APP SPECIFIC
# =============================================================================

class ElectronAppConfig(BaseModel):
    """Configuration specific to Electron desktop app."""
    # Window settings
    window_width: int = Field(1200)
    window_height: int = Field(800)
    min_window_width: int = Field(1024)
    min_window_height: int = Field(768)
    
    # Features
    enable_offline_mode: bool = Field(False, description="Allow offline exam taking with sync")
    enable_auto_update: bool = Field(True, description="Auto-update exam app")
    
    # Storage
    local_storage_path: str = Field("~/.fletter/exams")
    max_offline_storage_mb: int = Field(100)
    
    # Security
    disable_inspector: bool = Field(True, description="Disable DevTools in production")
    prevent_multiple_instances: bool = Field(True, description="Only one exam window")


class OfflineExamData(BaseModel):
    """Data for offline exam taking in Electron."""
    exam_id: UUID
    attempt_id: UUID
    downloaded_at: datetime
    expires_at: datetime
    
    questions: List[Dict[str, Any]]
    answers: Dict[str, Any] = Field(default={})
    
    sync_status: str = Field("pending", description="pending|synced|failed")
    last_sync_attempt: Optional[datetime] = None


# =============================================================================
# EXAM ATTEMPT (Simplified)
# =============================================================================

class SimplifiedExamStartRequest(BaseModel):
    """Start exam request from Electron app."""
    password: Optional[str] = None
    platform: str = Field(..., description="win32|darwin|linux")
    screen_resolution: str
    app_version: str


class SimplifiedExamStartResponse(BaseModel):
    """Response when starting exam in Electron."""
    attempt_id: UUID
    exam_id: UUID
    exam_title: str
    
    duration_minutes: int
    started_at: datetime
    ends_at: datetime
    
    total_marks: int
    passing_marks: int
    
    questions: List[Dict[str, Any]]
    question_count: int
    
    # Electron-specific config
    proctoring_config: SimplifiedProctoringConfig
    app_config: ElectronAppConfig
    
    # Offline support
    offline_token: Optional[str] = None
    offline_expires_at: Optional[datetime] = None


class SimplifiedExamAttempt(BaseModel):
    """Simplified exam attempt for desktop."""
    id: UUID
    exam_id: UUID
    student_id: UUID
    student_name: str
    
    started_at: datetime
    submitted_at: Optional[datetime]
    
    status: str
    total_marks: int
    obtained_marks: Optional[float]
    percentage: Optional[float]
    is_passed: Optional[bool]
    
    # Simplified tracking
    tab_switch_count: int
    warning_count: int
    was_auto_submitted: bool
    
    # IP info
    ip_address: Optional[str]
    is_ip_allowed: bool
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# PROCTOR ACTIONS
# =============================================================================

class ProctorAction(BaseModel):
    """Actions a proctor can take on students."""
    action_type: str = Field(..., description="warn|pause|resume|extend_time|force_submit|kick")
    student_id: UUID
    reason: str
    
    # For extend_time
    additional_minutes: Optional[int] = None
    
    # For warn
    warning_message: Optional[str] = None


class ProctorActionResponse(BaseModel):
    """Response after proctor action."""
    success: bool
    action_type: str
    student_id: UUID
    student_name: str
    message: str
    timestamp: datetime


# =============================================================================
# IP MANAGEMENT
# =============================================================================

class IPAuditLog(BaseModel):
    """Log of IP-based access attempts."""
    id: UUID
    exam_id: UUID
    student_id: Optional[UUID]
    
    ip_address: str
    user_agent: Optional[str]
    timestamp: datetime
    
    action: str = Field(..., description="allowed|blocked|warning")
    reason: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class BulkIPUpdate(BaseModel):
    """Bulk update IP restrictions."""
    add_allowed_ips: List[str] = []
    remove_allowed_ips: List[str] = []
    add_blocked_ips: List[str] = []
    clear_all: bool = False
