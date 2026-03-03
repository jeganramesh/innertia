"""
College Admin schemas.
Pydantic models for college admin role requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime


# =============================================================================
# DASHBOARD
# =============================================================================

class CollegeAdminDashboardStats(BaseModel):
    """College admin dashboard statistics."""
    total_users: int
    total_classes: int
    active_sessions: int
    total_students: int
    total_faculty: int
    assessment_module_enabled: bool = True
    exam_module_enabled: bool = True
    total_exams: int = 0
    total_assessments: int = 0
    completed_assessments: int = 0
    pending_assessments: int = 0


class CollegeAdminDashboardUser(BaseModel):
    """College admin user info in dashboard."""
    id: str
    email: str
    full_name: str
    college_name: Optional[str] = None


class CollegeAdminDashboardResponse(BaseModel):
    """College admin dashboard response."""
    user: CollegeAdminDashboardUser
    stats: CollegeAdminDashboardStats


# =============================================================================
# USERS
# =============================================================================

class UserCreateRequest(BaseModel):
    """Request to create a user in the college."""
    email: str = Field(..., description="User email address")
    name: Optional[str] = Field(None, description="User full name")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    role: str = Field(..., description="User role (staff, faculty, trainer, student)")
    is_active: bool = Field(True, description="Whether user is active")
    # Student-specific fields
    department_id: Optional[UUID] = Field(None, description="Department ID for students")
    current_year: Optional[int] = Field(None, description="Current year (1-4)")
    section: Optional[str] = Field(None, description="Section (e.g., A, B)")
    register_number: Optional[str] = Field(None, description="Register number (unique within college)")
    custom_fields: Optional[dict] = Field(None, description="Custom fields for students")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "john.doe@college.edu",
            "name": "John Doe",
            "password": "securepass123",
            "role": "student",
            "is_active": True,
            "department_id": "uuid",
            "current_year": 2,
            "section": "A",
            "register_number": "CS2024001",
            "custom_fields": {"hostel": "A", "scholarship": "yes"}
        }
    })


class UserBulkCreateRequest(BaseModel):
    """Request to bulk create users in the college."""
    users: List[UserCreateRequest] = Field(..., description="List of users to create")


class UserResponse(BaseModel):
    """User response model."""
    id: str
    email: str
    name: Optional[str] = None
    role: str
    is_active: bool
    created_at: str
    # Student-specific fields
    department_id: Optional[UUID] = None
    department_name: Optional[str] = None
    current_year: Optional[int] = None
    section: Optional[str] = None
    register_number: Optional[str] = None
    custom_fields: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Paginated list of users."""
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class UserUpdateRequest(BaseModel):
    """Request to update a user."""
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    # Student-specific fields
    department_id: Optional[UUID] = Field(None, description="Department ID for students")
    current_year: Optional[int] = Field(None, description="Current year (1-4)")
    section: Optional[str] = Field(None, description="Section (e.g., A, B)")
    register_number: Optional[str] = Field(None, description="Register number (unique within college)")
    custom_fields: Optional[dict] = Field(None, description="Custom fields for students")


# =============================================================================
# CLASSES
# =============================================================================

class ClassResponse(BaseModel):
    """Class response model."""
    id: str
    name: str
    department: Optional[str] = None
    academic_year: Optional[str] = None
    faculty_id: Optional[str] = None
    is_archived: bool = False


class ClassListResponse(BaseModel):
    """Paginated list of classes."""
    items: List[ClassResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ClassCreateRequest(BaseModel):
    """Request to create a class."""
    name: str
    department: Optional[str] = None
    academic_year: Optional[str] = None
    faculty_id: Optional[str] = None


class ClassUpdateRequest(BaseModel):
    """Request to update a class."""
    name: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None
    faculty_id: Optional[str] = None
    is_archived: Optional[bool] = None


# =============================================================================
# ENROLLMENTS
# =============================================================================

class EnrollmentResponse(BaseModel):
    """Enrollment response model."""
    id: str
    student_id: str
    student_name: str
    student_email: str
    class_id: str
    class_name: str
    enrolled_at: str


class EnrollmentListResponse(BaseModel):
    """Paginated list of enrollments."""
    items: List[EnrollmentResponse]
    total: int
    page: int
    page_size: int
    pages: int


class EnrollmentCreateRequest(BaseModel):
    """Request to create an enrollment."""
    student_id: str
    class_id: str


# =============================================================================
# ROLE FEATURES / PERMISSIONS
# =============================================================================

class RoleFeaturePermissionResponse(BaseModel):
    """Role feature permission response."""
    id: str
    feature_key: str
    role: str
    is_enabled: bool


class RoleFeaturePermissionUpdateRequest(BaseModel):
    """Request to update role feature permission."""
    is_enabled: bool


class RoleFeaturePermissionListResponse(BaseModel):
    """List of role feature permissions."""
    items: List[RoleFeaturePermissionResponse]
    total: int


# =============================================================================
# AUDIT LOGS
# =============================================================================

class AuditLogResponse(BaseModel):
    """Audit log response model."""
    id: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata_json: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    performed_by: str
    performed_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Paginated list of audit logs."""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    pages: int


# =============================================================================
# BULK UPLOAD
# =============================================================================

class BulkUploadFailedRow(BaseModel):
    """Failed row in bulk upload."""
    row: int
    email: str
    error: str


class BulkUploadResponse(BaseModel):
    """Response for bulk user upload."""
    created_count: int
    updated_count: int
    failed_rows: List[BulkUploadFailedRow]


# =============================================================================
# EXAMS
# =============================================================================

class ExamQuestionCreate(BaseModel):
    """Request to create an exam question."""
    question_text: str = Field(..., description="Question content")
    question_type: str = Field(..., description="Question type: mcq, true_false, short_answer, essay")
    options: Optional[List[dict]] = Field(None, description="For MCQ: array of {text, is_correct}")
    correct_answer: Optional[str] = Field(None, description="Correct answer for short answer/essay")
    marks: int = Field(1, description="Points for this question")
    order_index: int = Field(0, description="Question order")


class ExamQuestionResponse(BaseModel):
    """Exam question response."""
    id: UUID
    exam_id: UUID
    question_text: str
    question_type: str
    options: Optional[List[dict]]
    correct_answer: Optional[str]
    marks: int
    order_index: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExamCreate(BaseModel):
    """Request to create an exam."""
    title: str = Field(..., description="Exam title", max_length=255)
    description: Optional[str] = Field(None, description="Exam description")
    exam_type: str = Field(..., description="Exam type: quiz, midterm, final, practical")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled start date/time")
    duration_minutes: Optional[int] = Field(None, description="Exam duration in minutes")
    total_marks: Optional[int] = Field(None, description="Total marks")
    passing_marks: Optional[int] = Field(None, description="Passing marks")
    instructions: Optional[str] = Field(None, description="Exam instructions")


class ExamUpdate(BaseModel):
    """Request to update an exam."""
    title: Optional[str] = Field(None, description="Exam title", max_length=255)
    description: Optional[str] = Field(None, description="Exam description")
    exam_type: Optional[str] = Field(None, description="Exam type: quiz, midterm, final, practical")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled start date/time")
    duration_minutes: Optional[int] = Field(None, description="Exam duration in minutes")
    total_marks: Optional[int] = Field(None, description="Total marks")
    passing_marks: Optional[int] = Field(None, description="Passing marks")
    instructions: Optional[str] = Field(None, description="Exam instructions")


class ExamResponse(BaseModel):
    """Exam response."""
    id: UUID
    college_id: UUID
    title: str
    description: Optional[str]
    exam_type: str
    status: str
    scheduled_at: Optional[datetime]
    duration_minutes: Optional[int]
    total_marks: Optional[int]
    passing_marks: Optional[int]
    instructions: Optional[str]
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ExamListResponse(BaseModel):
    """Paginated list of exams."""
    items: List[ExamResponse]
    total: int
    page: int
    limit: int
    pages: int


class ExamStats(BaseModel):
    """Exam statistics."""
    total: int
    draft: int
    scheduled: int
    ongoing: int
    completed: int
    cancelled: int


# =============================================================================
# ASSESSMENTS
# =============================================================================

class AssessmentQuestionCreate(BaseModel):
    """Request to create an assessment question."""
    question_text: str = Field(..., description="Question content")
    question_type: str = Field(..., description="Question type: mcq, true_false, short_answer, essay")
    options: Optional[List[dict]] = Field(None, description="For MCQ: array of {text, is_correct}")
    correct_answer: Optional[str] = Field(None, description="Correct answer")
    marks: int = Field(1, description="Points for this question")
    order_index: int = Field(0, description="Question order")


class AssessmentQuestionResponse(BaseModel):
    """Assessment question response."""
    id: UUID
    assessment_id: UUID
    question_text: str
    question_type: str
    options: Optional[List[dict]]
    correct_answer: Optional[str]
    marks: int
    order_index: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentCreate(BaseModel):
    """Request to create an assessment."""
    title: str = Field(..., description="Assessment title", max_length=255)
    description: Optional[str] = Field(None, description="Assessment description")
    assessment_type: str = Field(..., description="Assessment type: quiz, assignment, lab")
    due_at: Optional[datetime] = Field(None, description="Submission deadline")
    total_marks: Optional[int] = Field(None, description="Total marks")


class AssessmentUpdate(BaseModel):
    """Request to update an assessment."""
    title: Optional[str] = Field(None, description="Assessment title", max_length=255)
    description: Optional[str] = Field(None, description="Assessment description")
    assessment_type: Optional[str] = Field(None, description="Assessment type: quiz, assignment, lab")
    due_at: Optional[datetime] = Field(None, description="Submission deadline")
    total_marks: Optional[int] = Field(None, description="Total marks")


class AssessmentResponse(BaseModel):
    """Assessment response."""
    id: UUID
    college_id: UUID
    title: str
    description: Optional[str]
    assessment_type: str
    status: str
    due_at: Optional[datetime]
    total_marks: Optional[int]
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AssessmentListResponse(BaseModel):
    """Paginated list of assessments."""
    items: List[AssessmentResponse]
    total: int
    page: int
    limit: int
    pages: int


class AssessmentStats(BaseModel):
    """Assessment statistics."""
    total: int
    draft: int
    published: int
    closed: int


# =============================================================================
# EXAM SUBMISSIONS
# =============================================================================

class ExamSubmissionResponse(BaseModel):
    """Exam submission response."""
    id: UUID
    exam_id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    started_at: datetime
    submitted_at: Optional[datetime]
    status: str
    total_obtained: Optional[int]
    graded_by: Optional[UUID]
    graded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExamSubmissionListResponse(BaseModel):
    """Paginated list of exam submissions."""
    items: List[ExamSubmissionResponse]
    total: int
    page: int
    limit: int
    pages: int


class ExamResultsResponse(BaseModel):
    """Exam aggregated results."""
    exam_id: UUID
    total_students: int
    submitted_count: int
    graded_count: int
    average_marks: Optional[float]
    pass_rate: Optional[float]
    highest_marks: Optional[int]
    lowest_marks: Optional[int]


# =============================================================================
# ASSESSMENT SUBMISSIONS
# =============================================================================

class AssessmentSubmissionResponse(BaseModel):
    """Assessment submission response."""
    id: UUID
    assessment_id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    started_at: datetime
    submitted_at: Optional[datetime]
    status: str
    total_obtained: Optional[int]
    graded_by: Optional[UUID]
    graded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentSubmissionListResponse(BaseModel):
    """Paginated list of assessment submissions."""
    items: List[AssessmentSubmissionResponse]
    total: int
    page: int
    limit: int
    pages: int


class AssessmentResultsResponse(BaseModel):
    """Assessment aggregated results."""
    assessment_id: UUID
    total_students: int
    submitted_count: int
    graded_count: int
    average_marks: Optional[float]
    pass_rate: Optional[float]
    highest_marks: Optional[int]
    lowest_marks: Optional[int]


# =============================================================================
# DEPARTMENTS
# =============================================================================

class DepartmentCreateRequest(BaseModel):
    """Request to create a department."""
    name: str = Field(..., description="Department name", min_length=1, max_length=100)
    code: str = Field(..., description="Department code", min_length=1, max_length=20)
    description: Optional[str] = Field(None, description="Department description")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Computer Science",
            "code": "CS",
            "description": "Department of Computer Science and Engineering"
        }
    })


class DepartmentUpdateRequest(BaseModel):
    """Request to update a department."""
    name: Optional[str] = Field(None, description="Department name", min_length=1, max_length=100)
    code: Optional[str] = Field(None, description="Department code", min_length=1, max_length=20)
    description: Optional[str] = Field(None, description="Department description")
    is_active: Optional[bool] = Field(None, description="Whether department is active")


class DepartmentResponse(BaseModel):
    """Department response model."""
    id: UUID
    name: str
    code: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DepartmentListResponse(BaseModel):
    """Paginated list of departments."""
    items: List[DepartmentResponse]
    total: int
    page: int
    limit: int
    pages: int


# =============================================================================
# CUSTOM FIELD DEFINITIONS
# =============================================================================

class CustomFieldOption(BaseModel):
    """Option for select type custom field."""
    value: str = Field(..., description="Option value")
    label: str = Field(..., description="Option display label")


class CustomFieldCreateRequest(BaseModel):
    """Request to create a custom field definition."""
    name: str = Field(..., description="Field display name", min_length=1, max_length=100)
    field_key: str = Field(..., description="Unique field key", min_length=1, max_length=100)
    field_type: str = Field(..., description="Field type: text, number, date, boolean, select")
    options: Optional[List[CustomFieldOption]] = Field(None, description="Options for select type")
    is_required: bool = Field(False, description="Whether field is required")
    is_filterable: bool = Field(True, description="Whether field can be used in filters")
    display_order: int = Field(0, description="Display order in forms")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Hostel",
            "field_key": "hostel",
            "field_type": "select",
            "options": [{"value": "A", "label": "Hostel A"}, {"value": "B", "label": "Hostel B"}],
            "is_required": False,
            "is_filterable": True,
            "display_order": 1
        }
    })


class CustomFieldUpdateRequest(BaseModel):
    """Request to update a custom field definition."""
    name: Optional[str] = Field(None, description="Field display name", min_length=1, max_length=100)
    field_type: Optional[str] = Field(None, description="Field type")
    options: Optional[List[CustomFieldOption]] = Field(None, description="Options for select type")
    is_required: Optional[bool] = Field(None, description="Whether field is required")
    is_filterable: Optional[bool] = Field(None, description="Whether field can be used in filters")
    display_order: Optional[int] = Field(None, description="Display order in forms")


class CustomFieldResponse(BaseModel):
    """Custom field definition response model."""
    id: UUID
    name: str
    field_key: str
    field_type: str
    options: Optional[List[dict]]
    is_required: bool
    is_filterable: bool
    display_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomFieldListResponse(BaseModel):
    """Paginated list of custom field definitions."""
    items: List[CustomFieldResponse]
    total: int
    page: int
    limit: int
    pages: int
