"""
Pydantic schemas for the Examination and Assessment System.

This module defines all the request/response schemas for:
- Batch management
- Exam templates
- Proctoring configuration
- Violations
- Live monitoring
- Student progress
- Exam/Assessment attempts
- Analytics
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# PROCTORING CONFIGURATION
# =============================================================================

class ProctoringConfig(BaseModel):
    """Proctoring configuration for exams."""
    fullscreen_mandatory: bool = Field(False, description="Require fullscreen mode")
    face_detection_required: bool = Field(True, description="Require face detection")
    tab_switch_limit: int = Field(5, description="Maximum allowed tab switches")
    violation_threshold: int = Field(3, description="Violations before auto-submit")
    allow_copy_paste: bool = Field(False, description="Allow copy-paste")
    allow_screenshots: bool = Field(False, description="Allow screenshots")
    idle_timeout_seconds: int = Field(60, description="Idle timeout in seconds")
    record_snapshots: bool = Field(True, description="Record periodic snapshots")
    snapshot_interval_seconds: int = Field(30, description="Snapshot interval")
    multiple_face_detection: bool = Field(True, description="Detect multiple faces")
    phone_detection: bool = Field(True, description="Detect phone usage")


# =============================================================================
# BATCH SCHEMAS
# =============================================================================

class BatchCreate(BaseModel):
    """Request to create a batch."""
    name: str = Field(..., description="Batch name", max_length=100)
    academic_year: Optional[str] = Field(None, description="Academic year (e.g., 2024-2025)")
    start_date: Optional[date] = Field(None, description="Batch start date")
    end_date: Optional[date] = Field(None, description="Batch end date")
    is_active: bool = Field(True, description="Whether batch is active")


class BatchUpdate(BaseModel):
    """Request to update a batch."""
    name: Optional[str] = Field(None, description="Batch name", max_length=100)
    academic_year: Optional[str] = Field(None, description="Academic year")
    start_date: Optional[date] = Field(None, description="Batch start date")
    end_date: Optional[date] = Field(None, description="Batch end date")
    is_active: Optional[bool] = Field(None, description="Whether batch is active")


class BatchResponse(BaseModel):
    """Batch response."""
    id: UUID
    college_id: UUID
    name: str
    academic_year: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXAM TEMPLATE SCHEMAS
# =============================================================================

class ExamTemplateCreate(BaseModel):
    """Request to create an exam template."""
    name: str = Field(..., description="Template name", max_length=100)
    description: Optional[str] = Field(None, description="Template description")
    duration_minutes: Optional[int] = Field(None, description="Default duration in minutes")
    total_marks: Optional[int] = Field(None, description="Default total marks")
    passing_marks: Optional[int] = Field(None, description="Default passing marks")
    shuffle_questions: bool = Field(False, description="Shuffle question order")
    shuffle_options: bool = Field(False, description="Shuffle answer options")
    allow_navigation: bool = Field(True, description="Allow question navigation")
    allow_review: bool = Field(False, description="Allow answer review before submit")
    show_result_immediately: bool = Field(False, description="Show result after submit")
    proctoring_config: Optional[ProctoringConfig] = Field(None, description="Proctoring settings")


class ExamTemplateUpdate(BaseModel):
    """Request to update an exam template."""
    name: Optional[str] = Field(None, description="Template name", max_length=100)
    description: Optional[str] = Field(None, description="Template description")
    duration_minutes: Optional[int] = Field(None, description="Default duration in minutes")
    total_marks: Optional[int] = Field(None, description="Default total marks")
    passing_marks: Optional[int] = Field(None, description="Default passing marks")
    shuffle_questions: Optional[bool] = Field(None, description="Shuffle question order")
    shuffle_options: Optional[bool] = Field(None, description="Shuffle answer options")
    allow_navigation: Optional[bool] = Field(None, description="Allow question navigation")
    allow_review: Optional[bool] = Field(None, description="Allow answer review before submit")
    show_result_immediately: Optional[bool] = Field(None, description="Show result after submit")
    proctoring_config: Optional[ProctoringConfig] = Field(None, description="Proctoring settings")


class ExamTemplateResponse(BaseModel):
    """Exam template response."""
    id: UUID
    college_id: UUID
    name: str
    description: Optional[str]
    duration_minutes: Optional[int]
    total_marks: Optional[int]
    passing_marks: Optional[int]
    shuffle_questions: bool
    shuffle_options: bool
    allow_navigation: bool
    allow_review: bool
    show_result_immediately: bool
    proctoring_config: Optional[Dict[str, Any]]
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXAM QUESTION SCHEMAS
# =============================================================================

class ExamQuestionCreate(BaseModel):
    """Request to create an exam question."""
    question_text: str = Field(..., description="Question content")
    question_type: str = Field(..., description="Question type: mcq, true_false, short_answer, essay")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="For MCQ: [{text, is_correct}, ...]")
    correct_answer: Optional[str] = Field(None, description="Correct answer (for auto-grading)")
    marks: int = Field(1, description="Points for this question")
    negative_marks: int = Field(0, description="Negative marks for wrong answer")
    section: Optional[str] = Field(None, description="Section name for section-wise timing")
    order_index: int = Field(0, description="Question order")


class ExamQuestionUpdate(BaseModel):
    """Request to update an exam question."""
    question_text: Optional[str] = Field(None, description="Question content")
    question_type: Optional[str] = Field(None, description="Question type")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="For MCQ options")
    correct_answer: Optional[str] = Field(None, description="Correct answer")
    marks: Optional[int] = Field(None, description="Points for this question")
    negative_marks: Optional[int] = Field(None, description="Negative marks")
    section: Optional[str] = Field(None, description="Section name")
    order_index: Optional[int] = Field(None, description="Question order")


class ExamQuestionResponse(BaseModel):
    """Exam question response."""
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
    created_at: datetime
    updated_at: datetime

    # For student view - hide correct answer
    include_correct_answer: bool = False

    model_config = ConfigDict(from_attributes=True)


class BulkQuestionCreate(BaseModel):
    """Request to create multiple questions at once."""
    questions: List[ExamQuestionCreate] = Field(..., description="List of questions to create")


class BulkQuestionResponse(BaseModel):
    """Response for bulk question creation."""
    created: int = Field(..., description="Number of questions created")
    questions: List[ExamQuestionResponse] = Field(..., description="Created questions")


# =============================================================================
# EXAM SCHEMAS (ENHANCED)
# =============================================================================

class ExamCreate(BaseModel):
    """Request to create an exam."""
    title: str = Field(..., description="Exam title", max_length=255)
    description: Optional[str] = Field(None, description="Exam description")
    exam_type: str = Field("quiz", description="Exam type: quiz, midterm, final, practical")
    course_id: Optional[UUID] = Field(None, description="Associated course/class")
    exam_template_id: Optional[UUID] = Field(None, description="Use template config")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled start date/time")
    duration_minutes: Optional[int] = Field(None, description="Exam duration in minutes")
    total_marks: Optional[int] = Field(None, description="Total marks")
    passing_marks: Optional[int] = Field(None, description="Passing marks")
    is_immediate: bool = Field(False, description="Start on student click")
    max_attempts: int = Field(1, description="Maximum attempts allowed")
    instructions: Optional[str] = Field(None, description="Exam instructions")
    proctoring_config: Optional[ProctoringConfig] = Field(None, description="Proctoring settings")


class ExamUpdate(BaseModel):
    """Request to update an exam."""
    title: Optional[str] = Field(None, description="Exam title", max_length=255)
    description: Optional[str] = Field(None, description="Exam description")
    exam_type: Optional[str] = Field(None, description="Exam type")
    course_id: Optional[UUID] = Field(None, description="Associated course/class")
    exam_template_id: Optional[UUID] = Field(None, description="Use template config")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled start date/time")
    duration_minutes: Optional[int] = Field(None, description="Exam duration")
    total_marks: Optional[int] = Field(None, description="Total marks")
    passing_marks: Optional[int] = Field(None, description="Passing marks")
    is_immediate: Optional[bool] = Field(None, description="Start on student click")
    max_attempts: Optional[int] = Field(None, description="Maximum attempts")
    instructions: Optional[str] = Field(None, description="Exam instructions")
    proctoring_config: Optional[ProctoringConfig] = Field(None, description="Proctoring settings")


class ExamResponse(BaseModel):
    """Exam response."""
    id: UUID
    college_id: UUID
    title: str
    description: Optional[str]
    exam_type: str
    status: str
    course_id: Optional[UUID]
    exam_template_id: Optional[UUID]
    scheduled_at: Optional[datetime]
    duration_minutes: Optional[int]
    total_marks: Optional[int]
    passing_marks: Optional[int]
    is_immediate: bool
    max_attempts: int
    instructions: Optional[str]
    proctoring_config: Optional[Dict[str, Any]]
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXAM ATTEMPT SCHEMAS
# =============================================================================

class ExamStartRequest(BaseModel):
    """Request to start an exam."""
    device_fingerprint: Optional[str] = Field(None, description="Device fingerprint")
    ip_address: Optional[str] = Field(None, description="Client IP address")
    user_agent: Optional[str] = Field(None, description="Browser user agent")


class ExamStartResponse(BaseModel):
    """Response after starting an exam."""
    attempt_id: UUID
    exam_id: UUID
    duration_minutes: int
    total_marks: int
    passing_marks: int
    questions: List[ExamQuestionResponse]
    started_at: datetime
    allow_navigation: bool
    allow_review: bool
    shuffle_questions: bool
    shuffle_options: bool
    proctoring_config: Optional[Dict[str, Any]]


class ExamSaveRequest(BaseModel):
    """Request to save exam answers."""
    answers: Dict[str, Any] = Field(..., description="Question ID to answer mapping")


class ExamSubmitRequest(BaseModel):
    """Request to submit exam."""
    answers: Dict[str, Any] = Field(..., description="Final answers")


class ExamAttemptResponse(BaseModel):
    """Exam attempt response."""
    id: UUID
    exam_id: UUID
    student_id: UUID
    started_at: datetime
    submitted_at: Optional[datetime]
    status: str
    total_obtained: Optional[int]
    graded_by: Optional[UUID]
    graded_at: Optional[datetime]
    answers: Optional[Dict[str, Any]]
    device_fingerprint: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    violation_count: int
    is_cheating: bool
    proctoring_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    # Related data
    student_name: Optional[str] = None
    exam_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ASSESSMENT QUESTION SCHEMAS
# =============================================================================

class AssessmentQuestionCreate(BaseModel):
    """Request to create an assessment question."""
    question_text: str = Field(..., description="Question content")
    question_type: str = Field(..., description="Question type: mcq, true_false, short_answer, essay")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="For MCQ: [{text, is_correct}, ...]")
    correct_answer: Optional[str] = Field(None, description="Correct answer")
    marks: int = Field(1, description="Points for this question")
    order_index: int = Field(0, description="Question order")


class AssessmentQuestionResponse(BaseModel):
    """Assessment question response."""
    id: UUID
    assessment_id: UUID
    question_text: str
    question_type: str
    options: Optional[List[Dict[str, Any]]]
    correct_answer: Optional[str]
    marks: int
    order_index: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ASSESSMENT SCHEMAS (ENHANCED)
# =============================================================================

class AssessmentCreate(BaseModel):
    """Request to create an assessment."""
    title: str = Field(..., description="Assessment title", max_length=255)
    description: Optional[str] = Field(None, description="Assessment description")
    assessment_type: str = Field("quiz", description="Type: quiz, assignment, lab")
    course_id: Optional[UUID] = Field(None, description="Associated course/class")
    due_at: Optional[datetime] = Field(None, description="Submission deadline")
    total_marks: Optional[int] = Field(None, description="Total marks")
    allow_retake: bool = Field(False, description="Allow retakes")
    max_attempts: Optional[int] = Field(None, description="Max attempts (null=unlimited)")
    shuffle_questions: bool = Field(False, description="Shuffle question order")


class AssessmentUpdate(BaseModel):
    """Request to update an assessment."""
    title: Optional[str] = Field(None, description="Assessment title", max_length=255)
    description: Optional[str] = Field(None, description="Assessment description")
    assessment_type: Optional[str] = Field(None, description="Type: quiz, assignment, lab")
    course_id: Optional[UUID] = Field(None, description="Associated course/class")
    due_at: Optional[datetime] = Field(None, description="Submission deadline")
    total_marks: Optional[int] = Field(None, description="Total marks")
    allow_retake: Optional[bool] = Field(None, description="Allow retakes")
    max_attempts: Optional[int] = Field(None, description="Max attempts")
    shuffle_questions: Optional[bool] = Field(None, description="Shuffle question order")


class AssessmentResponse(BaseModel):
    """Assessment response."""
    id: UUID
    college_id: UUID
    title: str
    description: Optional[str]
    assessment_type: str
    status: str
    course_id: Optional[UUID]
    due_at: Optional[datetime]
    total_marks: Optional[int]
    allow_retake: bool
    max_attempts: Optional[int]
    shuffle_questions: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ASSESSMENT ATTEMPT SCHEMAS
# =============================================================================

class AssessmentStartRequest(BaseModel):
    """Request to start an assessment."""
    pass


class AssessmentStartResponse(BaseModel):
    """Response after starting an assessment."""
    attempt_id: UUID
    assessment_id: UUID
    due_at: Optional[datetime]
    total_marks: int
    questions: List[AssessmentQuestionResponse]
    started_at: datetime
    allow_retake: bool
    max_attempts: Optional[int]
    shuffle_questions: bool


class AssessmentSaveRequest(BaseModel):
    """Request to save assessment answers."""
    answers: Dict[str, Any] = Field(..., description="Question ID to answer mapping")


class AssessmentSubmitRequest(BaseModel):
    """Request to submit assessment."""
    answers: Dict[str, Any] = Field(..., description="Final answers")


class AssessmentAttemptResponse(BaseModel):
    """Assessment attempt response."""
    id: UUID
    assessment_id: UUID
    student_id: UUID
    started_at: datetime
    submitted_at: Optional[datetime]
    status: str
    total_obtained: Optional[int]
    graded_by: Optional[UUID]
    graded_at: Optional[datetime]
    answers: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    # Related data
    student_name: Optional[str] = None
    assessment_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# VIOLATION SCHEMAS
# =============================================================================

class ViolationCreate(BaseModel):
    """Request to create a violation."""
    exam_submission_id: UUID
    violation_type: str
    severity: str = "medium"
    details: Optional[Dict[str, Any]] = None


class ViolationResponse(BaseModel):
    """Violation response."""
    id: UUID
    exam_submission_id: UUID
    timestamp: datetime
    violation_type: str
    severity: str
    details: Optional[Dict[str, Any]]
    acknowledged: bool
    created_at: datetime

    # Related data
    student_name: Optional[str] = None
    exam_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ViolationAcknowledge(BaseModel):
    """Request to acknowledge a violation."""
    acknowledged: bool = True


class ViolationBulkAcknowledge(BaseModel):
    """Request to bulk acknowledge violations."""
    violation_ids: List[UUID]
    acknowledged: bool = True


# =============================================================================
# LIVE MONITORING SCHEMAS
# =============================================================================

class LiveMonitoringSessionResponse(BaseModel):
    """Live monitoring session response."""
    id: UUID
    exam_id: UUID
    faculty_id: UUID
    started_at: datetime
    ended_at: Optional[datetime]
    created_at: datetime

    # Related data
    faculty_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MonitoringEventResponse(BaseModel):
    """Monitoring event response."""
    id: UUID
    exam_id: UUID
    student_id: UUID
    event_type: str
    details: Optional[Dict[str, Any]]
    created_at: datetime

    # Related data
    student_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ActiveStudentResponse(BaseModel):
    """Active student in monitoring."""
    student_id: UUID
    student_name: Optional[str]
    started_at: datetime
    violation_count: int
    status: str
    ip_address: Optional[str]


# =============================================================================
# PROCTORING SNAPSHOT SCHEMAS
# =============================================================================

class ProctoringSnapshotResponse(BaseModel):
    """Proctoring snapshot response."""
    id: UUID
    exam_submission_id: UUID
    timestamp: datetime
    image_url: Optional[str]
    face_data: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# STUDENT PROGRESS SCHEMAS
# =============================================================================

class StudentProgressSnapshotResponse(BaseModel):
    """Student progress snapshot response."""
    id: UUID
    student_id: UUID
    snapshot_date: datetime
    exams_taken: int
    avg_score: Optional[float]
    total_violations: int
    department_id: Optional[UUID]
    batch_id: Optional[UUID]
    year: Optional[int]
    data: Optional[Dict[str, Any]]
    created_at: datetime

    # Related data
    student_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DepartmentProgressResponse(BaseModel):
    """Department progress response."""
    department_id: UUID
    department_name: str
    total_students: int
    exams_taken: int
    avg_score: Optional[float]
    total_violations: int
    pass_rate: Optional[float]
    snapshot_date: datetime


# =============================================================================
# ANALYTICS SCHEMAS
# =============================================================================

class ExamAnalyticsResponse(BaseModel):
    """Exam analytics response."""
    exam_id: UUID
    exam_title: str
    total_students: int
    attempts_count: int
    completed_count: int
    avg_score: Optional[float]
    highest_score: Optional[int]
    lowest_score: Optional[int]
    pass_count: int
    fail_count: int
    pass_rate: Optional[float]
    avg_time_taken_minutes: Optional[float]
    violation_count: int
    flagged_cheating_count: int


class StudentAnalyticsResponse(BaseModel):
    """Student analytics response."""
    student_id: UUID
    student_name: Optional[str]
    exams_taken: int
    assessments_taken: int
    avg_exam_score: Optional[float]
    avg_assessment_score: Optional[float]
    total_violations: int
    recent_attempts: List[ExamAttemptResponse]


class QuestionHeatmapResponse(BaseModel):
    """Question performance heatmap."""
    question_id: UUID
    question_text: str
    total_attempts: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    correct_percentage: float
    avg_marks_obtained: float


# =============================================================================
# PAGINATED RESPONSES
# =============================================================================

class PaginatedExamResponse(BaseModel):
    """Paginated exam list."""
    items: List[ExamResponse]
    total: int
    page: int
    limit: int
    pages: int


class PaginatedAssessmentResponse(BaseModel):
    """Paginated assessment list."""
    items: List[AssessmentResponse]
    total: int
    page: int
    limit: int
    pages: int


class PaginatedViolationResponse(BaseModel):
    """Paginated violation list."""
    items: List[ViolationResponse]
    total: int
    page: int
    limit: int
    pages: int


class PaginatedExamAttemptResponse(BaseModel):
    """Paginated exam attempt list."""
    items: List[ExamAttemptResponse]
    total: int
    page: int
    limit: int
    pages: int
