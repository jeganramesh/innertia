"""
Enhanced Pydantic schemas for Professional Examination System.

This module extends the base examination schemas with:
- Advanced question types (coding, fill-blanks, matching)
- Section-based exam management
- Enhanced proctoring features
- Comprehensive analytics
- Import/Export capabilities
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict, validator


# =============================================================================
# ENHANCED QUESTION TYPES
# =============================================================================

class CodingQuestionConfig(BaseModel):
    """Configuration for coding questions."""
    language: str = Field(..., description="Programming language (python, javascript, java, cpp)")
    starter_code: Optional[str] = Field(None, description="Starter code template")
    test_cases: List[Dict[str, Any]] = Field(default=[], description="Test cases for validation")
    time_limit_seconds: int = Field(5, description="Execution time limit per test case")
    memory_limit_mb: int = Field(256, description="Memory limit in MB")
    allow_multiple_solutions: bool = Field(False, description="Allow multiple correct solutions")


class FillBlanksQuestionConfig(BaseModel):
    """Configuration for fill in the blanks questions."""
    text_with_blanks: str = Field(..., description="Text with __blank__ placeholders")
    blanks: List[Dict[str, Any]] = Field(..., description="List of blanks with correct answers")
    case_sensitive: bool = Field(True, description="Whether answers are case sensitive")
    allow_partial_credit: bool = Field(True, description="Give partial credit for partial answers")


class MatchingQuestionConfig(BaseModel):
    """Configuration for matching questions."""
    left_items: List[Dict[str, Any]] = Field(..., description="Left side items")
    right_items: List[Dict[str, Any]] = Field(..., description="Right side items")
    correct_pairs: List[Dict[str, str]] = Field(..., description="Correct left-right pairs")
    allow_multiple_matches: bool = Field(False, description="Allow multiple matches per item")


class QuestionMedia(BaseModel):
    """Media attachments for questions."""
    type: str = Field(..., description="Media type: image, video, audio, document")
    url: str = Field(..., description="Media URL")
    thumbnail_url: Optional[str] = Field(None, description="Thumbnail URL for videos")
    caption: Optional[str] = Field(None, description="Media caption")


# =============================================================================
# ENHANCED QUESTION SCHEMAS
# =============================================================================

class EnhancedExamQuestionCreate(BaseModel):
    """Enhanced request to create an exam question with all types."""
    question_text: str = Field(..., description="Question content")
    question_type: str = Field(..., description="Question type: mcq, true_false, short_answer, essay, coding, fill_blanks, matching")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="For MCQ: [{text, is_correct}, ...]")
    correct_answer: Optional[str] = Field(None, description="Correct answer")
    marks: int = Field(1, description="Points for this question")
    negative_marks: int = Field(0, description="Negative marks for wrong answer")
    section: Optional[str] = Field(None, description="Section name")
    order_index: int = Field(0, description="Question order")
    
    # Enhanced fields
    media: Optional[List[QuestionMedia]] = Field(None, description="Media attachments")
    explanation: Optional[str] = Field(None, description="Explanation shown after submission")
    hint: Optional[str] = Field(None, description="Hint for the question")
    difficulty: str = Field("medium", description="Difficulty: easy, medium, hard")
    tags: Optional[List[str]] = Field(None, description="Question tags")
    
    # Advanced question type configs
    coding_config: Optional[CodingQuestionConfig] = Field(None, description="Config for coding questions")
    fill_blanks_config: Optional[FillBlanksQuestionConfig] = Field(None, description="Config for fill blanks")
    matching_config: Optional[MatchingQuestionConfig] = Field(None, description="Config for matching")


class EnhancedExamQuestionResponse(BaseModel):
    """Enhanced exam question response."""
    id: UUID
    exam_id: UUID
    question_text: str
    question_type: str
    options: Optional[List[Dict[str, Any]]]
    correct_answer: Optional[str]
    marks: int
    negative_marks: int
    section: Optional[str]
    order_index: int
    media: Optional[List[QuestionMedia]]
    explanation: Optional[str]
    hint: Optional[str]
    difficulty: str
    tags: Optional[List[str]]
    coding_config: Optional[CodingQuestionConfig]
    fill_blanks_config: Optional[FillBlanksQuestionConfig]
    matching_config: Optional[MatchingQuestionConfig]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# SECTION MANAGEMENT SCHEMAS
# =============================================================================

class ExamSectionCreate(BaseModel):
    """Request to create an exam section."""
    name: str = Field(..., description="Section name")
    description: Optional[str] = Field(None, description="Section description")
    duration_minutes: Optional[int] = Field(None, description="Time limit for this section")
    order_index: int = Field(0, description="Section order")
    instructions: Optional[str] = Field(None, description="Section-specific instructions")
    shuffle_questions: bool = Field(False, description="Shuffle questions in this section")


class ExamSectionResponse(BaseModel):
    """Exam section response."""
    id: UUID
    exam_id: UUID
    name: str
    description: Optional[str]
    duration_minutes: Optional[int]
    order_index: int
    instructions: Optional[str]
    shuffle_questions: bool
    question_count: int = 0
    total_marks: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ENHANCED EXAM SCHEMAS
# =============================================================================

class EnhancedExamCreate(BaseModel):
    """Enhanced request to create a professional exam."""
    title: str = Field(..., description="Exam title", max_length=255)
    description: Optional[str] = Field(None, description="Exam description")
    exam_type: str = Field("mcq", description="Exam type: mcq, coding, mixed")
    course_id: Optional[UUID] = Field(None, description="Associated course")
    exam_template_id: Optional[UUID] = Field(None, description="Template ID")
    
    # Scheduling
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled start time")
    scheduled_end_at: Optional[datetime] = Field(None, description="Scheduled end time")
    timezone: str = Field("UTC", description="Timezone for scheduling")
    is_immediate: bool = Field(False, description="Start on student click")
    
    # Duration and attempts
    duration_minutes: Optional[int] = Field(None, description="Total exam duration")
    max_attempts: int = Field(1, description="Maximum attempts")
    allow_late_submission: bool = Field(False, description="Allow late submissions")
    late_submission_penalty: Optional[float] = Field(None, description="Penalty percentage for late submission")
    
    # Marks
    total_marks: Optional[int] = Field(None, description="Total marks")
    passing_marks: Optional[int] = Field(None, description="Passing marks")
    passing_percentage: Optional[float] = Field(None, description="Passing percentage")
    
    # Instructions and content
    instructions: Optional[str] = Field(None, description="General instructions")
    welcome_message: Optional[str] = Field(None, description="Welcome message shown at start")
    completion_message: Optional[str] = Field(None, description="Message shown on completion")
    
    # Question settings
    shuffle_questions: bool = Field(False, description="Shuffle question order")
    shuffle_options: bool = Field(False, description="Shuffle MCQ options")
    allow_navigation: bool = Field(True, description="Allow question navigation")
    allow_review: bool = Field(False, description="Allow answer review")
    show_result_immediately: bool = Field(False, description="Show result after submit")
    show_correct_answers: bool = Field(False, description="Show correct answers after completion")
    show_explanations: bool = Field(False, description="Show explanations after completion")
    
    # Proctoring
    proctoring_enabled: bool = Field(False, description="Enable proctoring")
    proctoring_config: Optional[Dict[str, Any]] = Field(None, description="Proctoring settings")
    
    # Access control
    require_password: bool = Field(False, description="Require password to start")
    password: Optional[str] = Field(None, description="Exam password")
    allowed_ip_ranges: Optional[List[str]] = Field(None, description="Allowed IP ranges")
    
    # Notifications
    notify_students_on_publish: bool = Field(True, description="Send notification when published")
    reminder_before_minutes: Optional[int] = Field(None, description="Send reminder before exam")


class EnhancedExamUpdate(BaseModel):
    """Enhanced request to update an exam."""
    title: Optional[str] = Field(None, description="Exam title")
    description: Optional[str] = Field(None, description="Exam description")
    exam_type: Optional[str] = Field(None, description="Exam type")
    course_id: Optional[UUID] = Field(None, description="Associated course")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled start time")
    scheduled_end_at: Optional[datetime] = Field(None, description="Scheduled end time")
    timezone: Optional[str] = Field(None, description="Timezone")
    duration_minutes: Optional[int] = Field(None, description="Exam duration")
    max_attempts: Optional[int] = Field(None, description="Maximum attempts")
    total_marks: Optional[int] = Field(None, description="Total marks")
    passing_marks: Optional[int] = Field(None, description="Passing marks")
    instructions: Optional[str] = Field(None, description="Instructions")
    status: Optional[str] = Field(None, description="Exam status")
    
    @validator('status')
    def validate_status_transition(cls, v):
        allowed_transitions = {
            'draft': ['scheduled', 'cancelled'],
            'scheduled': ['ongoing', 'cancelled'],
            'ongoing': ['completed'],
            'completed': [],
            'cancelled': ['draft']
        }
        return v


class EnhancedExamResponse(BaseModel):
    """Enhanced exam response with all professional features."""
    id: UUID
    college_id: UUID
    title: str
    description: Optional[str]
    exam_type: str
    status: str
    course_id: Optional[UUID]
    exam_template_id: Optional[UUID]
    
    # Scheduling
    scheduled_at: Optional[datetime]
    scheduled_end_at: Optional[datetime]
    timezone: str
    is_immediate: bool
    
    # Duration and attempts
    duration_minutes: Optional[int]
    max_attempts: int
    allow_late_submission: bool
    late_submission_penalty: Optional[float]
    
    # Marks
    total_marks: Optional[int]
    passing_marks: Optional[int]
    
    # Instructions
    instructions: Optional[str]
    welcome_message: Optional[str]
    completion_message: Optional[str]
    
    # Settings
    shuffle_questions: bool
    shuffle_options: bool
    allow_navigation: bool
    allow_review: bool
    show_result_immediately: bool
    show_correct_answers: bool
    show_explanations: bool
    
    # Proctoring
    proctoring_enabled: bool
    proctoring_config: Optional[Dict[str, Any]]
    
    # Access
    require_password: bool
    allowed_ip_ranges: Optional[List[str]]
    
    # Metadata
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    question_count: int = 0
    section_count: int = 0
    registered_students: int = 0
    submitted_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# IMPORT/EXPORT SCHEMAS
# =============================================================================

class QuestionImportItem(BaseModel):
    """Single question for import."""
    question_text: str
    question_type: str
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[str] = None
    marks: int = 1
    section: Optional[str] = None
    difficulty: str = "medium"
    tags: Optional[List[str]] = None


class BulkQuestionImport(BaseModel):
    """Request to import questions from various formats."""
    format: str = Field(..., description="Import format: json, csv, excel, qti")
    questions: List[QuestionImportItem] = Field(..., description="Questions to import")
    section_mapping: Optional[Dict[str, UUID]] = Field(None, description="Map section names to IDs")
    skip_validation: bool = Field(False, description="Skip validation for faster import")


class QuestionExportRequest(BaseModel):
    """Request to export questions."""
    format: str = Field(..., description="Export format: json, csv, excel, pdf, qti")
    exam_id: UUID
    section_ids: Optional[List[UUID]] = Field(None, description="Filter by sections")
    include_answers: bool = Field(True, description="Include correct answers")
    include_explanations: bool = Field(True, description="Include explanations")


class ImportExportResponse(BaseModel):
    """Response for import/export operations."""
    success: bool
    message: str
    processed_count: int
    error_count: int
    errors: Optional[List[Dict[str, Any]]] = None
    download_url: Optional[str] = None


# =============================================================================
# ENHANCED ANALYTICS SCHEMAS
# =============================================================================

class QuestionAnalytics(BaseModel):
    """Analytics for a single question."""
    question_id: UUID
    question_text: str
    question_type: str
    marks: int
    
    # Performance metrics
    attempts_count: int
    correct_count: int
    incorrect_count: int
    skipped_count: int
    
    # Statistics
    accuracy_rate: float
    avg_time_seconds: Optional[float]
    difficulty_index: float  # 0-1, higher means more difficult
    discrimination_index: float  # How well it discriminates between high/low performers
    
    # Option analysis for MCQ
    option_distribution: Optional[Dict[str, int]] = None


class SectionAnalytics(BaseModel):
    """Analytics for an exam section."""
    section_id: UUID
    section_name: str
    
    total_marks: int
    avg_score: float
    max_score: float
    min_score: float
    
    avg_time_minutes: float
    question_count: int


class EnhancedExamAnalyticsResponse(BaseModel):
    """Comprehensive exam analytics."""
    exam_id: UUID
    exam_title: str
    
    # Participation
    total_registered: int
    total_attempted: int
    total_submitted: int
    completion_rate: float
    
    # Performance
    avg_score: float
    median_score: float
    max_score: float
    min_score: float
    std_deviation: float
    
    # Pass/Fail
    passing_count: int
    failing_count: int
    pass_rate: float
    
    # Timing
    avg_completion_time_minutes: float
    on_time_submissions: int
    late_submissions: int
    
    # Proctoring
    total_violations: int
    avg_violations_per_student: float
    students_with_violations: int
    
    # Section breakdown
    section_analytics: List[SectionAnalytics]
    
    # Question analysis
    question_analytics: List[QuestionAnalytics]
    
    # Score distribution
    score_distribution: Dict[str, int]  # Range -> count
    
    # Time distribution
    time_distribution: Dict[str, int]  # Range -> count


class StudentDetailedAnalytics(BaseModel):
    """Detailed analytics for a single student."""
    student_id: UUID
    student_name: str
    
    # Attempt info
    attempt_id: UUID
    attempt_number: int
    started_at: datetime
    submitted_at: Optional[datetime]
    completion_time_minutes: Optional[float]
    
    # Scores
    total_marks: int
    obtained_marks: float
    percentage: float
    is_passed: bool
    rank: Optional[int]
    
    # Section scores
    section_scores: List[Dict[str, Any]]
    
    # Question-level details
    question_responses: List[Dict[str, Any]]
    
    # Proctoring
    violation_count: int
    violations: List[Dict[str, Any]]
    
    # Time tracking
    time_per_question: Dict[UUID, float]


class ComparativeAnalytics(BaseModel):
    """Comparative analytics between exams or groups."""
    exam_id: UUID
    exam_title: str
    
    # Comparison metrics
    avg_score: float
    pass_rate: float
    completion_rate: float
    avg_completion_time: float
    
    # Comparison with previous exam
    previous_exam_id: Optional[UUID]
    score_improvement: Optional[float]
    pass_rate_change: Optional[float]
    
    # Class/Group comparison
    group_comparisons: List[Dict[str, Any]]


# =============================================================================
# PROCTORING ENHANCEMENT SCHEMAS
# =============================================================================

class EnhancedProctoringConfig(BaseModel):
    """Enhanced proctoring configuration."""
    # Basic proctoring
    enabled: bool = Field(True, description="Enable proctoring")
    fullscreen_mandatory: bool = Field(False, description="Require fullscreen")
    tab_switch_limit: int = Field(5, description="Max tab switches allowed")
    violation_threshold: int = Field(3, description="Violations before auto-submit")
    
    # Face detection
    face_detection_required: bool = Field(True, description="Require face detection")
    face_detection_interval: int = Field(30, description="Face check interval in seconds")
    multiple_face_detection: bool = Field(True, description="Detect multiple faces")
    face_not_visible_limit: int = Field(3, description="Warnings before violation")
    
    # Object detection
    phone_detection: bool = Field(True, description="Detect phone usage")
    book_detection: bool = Field(False, description="Detect books/notes")
    person_detection: bool = Field(True, description="Detect other persons")
    
    # Screen monitoring
    record_screen: bool = Field(False, description="Record screen activity")
    screenshot_interval: int = Field(30, description="Screenshot interval in seconds")
    screen_capture_on_violation: bool = Field(True, description="Capture screen on violation")
    
    # Input monitoring
    allow_copy_paste: bool = Field(False, description="Allow copy-paste")
    allow_right_click: bool = Field(False, description="Allow right click")
    allow_keyboard_shortcuts: bool = Field(False, description="Allow keyboard shortcuts")
    
    # Audio monitoring
    record_audio: bool = Field(False, description="Record audio")
    noise_detection: bool = Field(False, description="Detect unusual noise")
    
    # ID Verification
    require_id_verification: bool = Field(False, description="Require ID photo verification")
    id_verification_before_start: bool = Field(True, description="Verify ID before exam")
    
    # Room scan
    require_room_scan: bool = Field(False, description="Require 360 room scan")
    room_scan_before_start: bool = Field(True, description="Room scan before exam")


class IDVerificationRequest(BaseModel):
    """Request for ID verification."""
    attempt_id: UUID
    id_image_url: str = Field(..., description="URL of ID card photo")
    selfie_image_url: str = Field(..., description="URL of selfie for comparison")
    id_type: str = Field("student_id", description="Type of ID")


class IDVerificationResponse(BaseModel):
    """Response for ID verification."""
    attempt_id: UUID
    verified: bool
    confidence_score: float
    verification_method: str
    verified_at: Optional[datetime]
    rejection_reason: Optional[str]


class RoomScanRequest(BaseModel):
    """Request for room scan submission."""
    attempt_id: UUID
    scan_video_url: str = Field(..., description="URL of room scan video")
    scan_images: List[str] = Field(default=[], description="Additional room images")


class ProctoringEventCreate(BaseModel):
    """Request to create a proctoring event."""
    attempt_id: UUID
    event_type: str = Field(..., description="Event type: tab_switch, fullscreen_exit, face_missing, multiple_faces, phone_detected, etc.")
    severity: str = Field("low", description="Event severity: low, medium, high, critical")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional event details")
    screenshot_url: Optional[str] = Field(None, description="Screenshot at event time")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ProctoringEventResponse(BaseModel):
    """Response for proctoring events."""
    id: UUID
    attempt_id: UUID
    event_type: str
    severity: str
    details: Optional[Dict[str, Any]]
    screenshot_url: Optional[str]
    timestamp: datetime
    acknowledged: bool
    acknowledged_by: Optional[UUID]
    acknowledged_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXAM ATTEMPT ENHANCEMENT SCHEMAS
# =============================================================================

class EnhancedExamStartRequest(BaseModel):
    """Enhanced request to start an exam."""
    device_fingerprint: Optional[str] = Field(None, description="Device fingerprint")
    ip_address: Optional[str] = Field(None, description="Client IP")
    user_agent: Optional[str] = Field(None, description="Browser user agent")
    screen_resolution: Optional[str] = Field(None, description="Screen resolution")
    os_info: Optional[str] = Field(None, description="Operating system")
    browser_info: Optional[str] = Field(None, description="Browser info")
    password: Optional[str] = Field(None, description="Exam password if required")


class EnhancedExamStartResponse(BaseModel):
    """Enhanced response after starting exam."""
    attempt_id: UUID
    exam_id: UUID
    exam_title: str
    
    # Timing
    duration_minutes: int
    started_at: datetime
    ends_at: datetime
    
    # Exam content
    total_marks: int
    passing_marks: int
    question_count: int
    sections: List[ExamSectionResponse]
    
    # Questions (with or without answers based on settings)
    questions: List[EnhancedExamQuestionResponse]
    
    # Settings
    allow_navigation: bool
    allow_review: bool
    shuffle_questions: bool
    shuffle_options: bool
    
    # Proctoring
    proctoring_enabled: bool
    proctoring_config: Optional[EnhancedProctoringConfig]
    
    # Messages
    welcome_message: Optional[str]
    instructions: Optional[str]


class SectionTimeTracking(BaseModel):
    """Time tracking for a section."""
    section_id: UUID
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    time_spent_seconds: int = 0


class EnhancedExamSaveRequest(BaseModel):
    """Enhanced request to save exam progress."""
    answers: Dict[str, Any] = Field(..., description="Question ID to answer mapping")
    current_section_id: Optional[UUID] = Field(None, description="Current section")
    section_time_tracking: Optional[List[SectionTimeTracking]] = Field(None, description="Time spent per section")
    time_remaining_seconds: Optional[int] = Field(None, description="Client-reported time remaining")


class EnhancedExamSubmitRequest(BaseModel):
    """Enhanced request to submit exam."""
    answers: Dict[str, Any] = Field(..., description="Final answers")
    section_time_tracking: List[SectionTimeTracking] = Field(default=[], description="Time spent per section")
    time_spent_seconds: int = Field(..., description="Total time spent")
    feedback: Optional[str] = Field(None, description="Student feedback about exam")
    technical_issues: Optional[str] = Field(None, description="Report technical issues")


class EnhancedExamAttemptResponse(BaseModel):
    """Enhanced exam attempt response."""
    id: UUID
    exam_id: UUID
    exam_title: str
    student_id: UUID
    student_name: str
    
    # Timing
    started_at: datetime
    submitted_at: Optional[datetime]
    completion_time_minutes: Optional[float]
    
    # Status
    status: str
    
    # Scoring
    total_marks: int
    obtained_marks: Optional[float]
    percentage: Optional[float]
    is_passed: Optional[bool]
    
    # Answers and grading
    answers: Optional[Dict[str, Any]]
    graded_by: Optional[UUID]
    graded_by_name: Optional[str]
    graded_at: Optional[datetime]
    grading_notes: Optional[str]
    
    # Section scores
    section_scores: Optional[List[Dict[str, Any]]]
    
    # Proctoring
    violation_count: int
    is_cheating_flagged: bool
    proctoring_review_status: str = Field("pending", description="pending, reviewed, cleared")
    
    # Device info
    device_fingerprint: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXAM RESULT SCHEMAS
# =============================================================================

class ExamResultSummary(BaseModel):
    """Summary result for a student."""
    attempt_id: UUID
    exam_id: UUID
    exam_title: str
    
    # Score
    total_marks: int
    obtained_marks: float
    percentage: float
    grade: Optional[str]
    is_passed: bool
    
    # Performance
    rank: Optional[int]
    total_participants: int
    percentile: Optional[float]
    
    # Timing
    completion_time_minutes: float
    avg_time_per_question: float
    
    # Comparison
    class_average: float
    class_highest: float
    class_lowest: float


class DetailedQuestionResult(BaseModel):
    """Detailed result for a single question."""
    question_id: UUID
    question_text: str
    question_type: str
    marks: int
    
    # Student's response
    given_answer: Any
    is_correct: bool
    obtained_marks: float
    
    # Correct answer (if allowed to show)
    correct_answer: Optional[Any]
    explanation: Optional[str]
    
    # Time tracking
    time_spent_seconds: Optional[float]


class DetailedExamResult(BaseModel):
    """Detailed exam result with question-level breakdown."""
    summary: ExamResultSummary
    section_results: List[Dict[str, Any]]
    question_results: List[DetailedQuestionResult]
    
    # Performance analysis
    strong_areas: List[str]
    weak_areas: List[str]
    time_analysis: Dict[str, Any]
    
    # Recommendations
    recommendations: List[str]


class LeaderboardEntry(BaseModel):
    """Single entry in exam leaderboard."""
    rank: int
    student_id: UUID
    student_name: str
    obtained_marks: float
    percentage: float
    completion_time_minutes: float
    submitted_at: datetime


class ExamLeaderboardResponse(BaseModel):
    """Exam leaderboard response."""
    exam_id: UUID
    exam_title: str
    total_participants: int
    entries: List[LeaderboardEntry]
    user_rank: Optional[int]
    user_entry: Optional[LeaderboardEntry]
