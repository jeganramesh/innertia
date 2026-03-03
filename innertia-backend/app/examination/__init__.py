"""
Examination module initialization.
"""

from app.examination.schemas import (
    # Batch schemas
    BatchCreate,
    BatchUpdate,
    BatchResponse,
    # Exam Template schemas
    ExamTemplateCreate,
    ExamTemplateUpdate,
    ExamTemplateResponse,
    # Proctoring config
    ProctoringConfig,
    # Violation schemas
    ViolationCreate,
    ViolationResponse,
    ViolationAcknowledge,
    # Live monitoring schemas
    LiveMonitoringSessionResponse,
    MonitoringEventResponse,
    # Student progress schemas
    StudentProgressSnapshotResponse,
    DepartmentProgressResponse,
    # Exam attempt schemas
    ExamStartRequest,
    ExamStartResponse,
    ExamSubmitRequest,
    ExamSaveRequest,
    ExamAttemptResponse,
    ExamQuestionResponse,
    # Assessment attempt schemas
    AssessmentStartRequest,
    AssessmentStartResponse,
    AssessmentSubmitRequest,
    AssessmentSaveRequest,
    AssessmentAttemptResponse,
    # Analytics schemas
    ExamAnalyticsResponse,
    StudentAnalyticsResponse,
    QuestionHeatmapResponse,
)

from app.examination.schemas_enhanced import (
    # Enhanced exam schemas
    EnhancedExamCreate,
    EnhancedExamUpdate,
    EnhancedExamResponse,
    EnhancedExamQuestionCreate,
    EnhancedExamQuestionResponse,
    # Section schemas
    ExamSectionCreate,
    ExamSectionResponse,
    # Enhanced attempt schemas
    EnhancedExamStartRequest,
    EnhancedExamStartResponse,
    EnhancedExamSubmitRequest,
    EnhancedExamSaveRequest,
    EnhancedExamAttemptResponse,
    # Import/Export schemas
    BulkQuestionImport,
    ImportExportResponse,
    QuestionExportRequest,
    # Analytics schemas
    EnhancedExamAnalyticsResponse,
    StudentDetailedAnalytics,
    ExamLeaderboardResponse,
    LeaderboardEntry,
    # Proctoring schemas
    EnhancedProctoringConfig,
    ProctoringEventCreate,
    ProctoringEventResponse,
    IDVerificationRequest,
    IDVerificationResponse,
    # Question configs
    CodingQuestionConfig,
    FillBlanksQuestionConfig,
    MatchingQuestionConfig,
    QuestionMedia,
)

from app.examination.router import router as examination_router
from app.examination.router_enhanced import router as examination_enhanced_router

# Export enhanced schemas
__all__ = [
    # Base schemas
    "BatchCreate", "BatchUpdate", "BatchResponse",
    "ExamTemplateCreate", "ExamTemplateUpdate", "ExamTemplateResponse",
    "ProctoringConfig",
    "ViolationCreate", "ViolationResponse", "ViolationAcknowledge",
    "LiveMonitoringSessionResponse", "MonitoringEventResponse",
    "StudentProgressSnapshotResponse", "DepartmentProgressResponse",
    "ExamStartRequest", "ExamStartResponse", "ExamSubmitRequest",
    "ExamSaveRequest", "ExamAttemptResponse", "ExamQuestionResponse",
    "AssessmentStartRequest", "AssessmentStartResponse",
    "AssessmentSubmitRequest", "AssessmentSaveRequest", "AssessmentAttemptResponse",
    "ExamAnalyticsResponse", "StudentAnalyticsResponse", "QuestionHeatmapResponse",
    # Enhanced schemas
    "EnhancedExamCreate", "EnhancedExamUpdate", "EnhancedExamResponse",
    "EnhancedExamQuestionCreate", "EnhancedExamQuestionResponse",
    "ExamSectionCreate", "ExamSectionResponse",
    "EnhancedExamStartRequest", "EnhancedExamStartResponse",
    "EnhancedExamSubmitRequest", "EnhancedExamSaveRequest", "EnhancedExamAttemptResponse",
    "BulkQuestionImport", "ImportExportResponse", "QuestionExportRequest",
    "EnhancedExamAnalyticsResponse", "StudentDetailedAnalytics",
    "ExamLeaderboardResponse", "LeaderboardEntry",
    "EnhancedProctoringConfig", "ProctoringEventCreate", "ProctoringEventResponse",
    "IDVerificationRequest", "IDVerificationResponse",
    "CodingQuestionConfig", "FillBlanksQuestionConfig", "MatchingQuestionConfig",
    "QuestionMedia",
    # Routers
    "examination_router", "examination_enhanced_router",
]

__all__ = [
    "BatchCreate",
    "BatchUpdate",
    "BatchResponse",
    "ExamTemplateCreate",
    "ExamTemplateUpdate",
    "ExamTemplateResponse",
    "ProctoringConfig",
    "ViolationCreate",
    "ViolationResponse",
    "ViolationAcknowledge",
    "LiveMonitoringSessionResponse",
    "MonitoringEventResponse",
    "StudentProgressSnapshotResponse",
    "DepartmentProgressResponse",
    "ExamStartRequest",
    "ExamStartResponse",
    "ExamSubmitRequest",
    "ExamSaveRequest",
    "ExamAttemptResponse",
    "ExamQuestionResponse",
    "AssessmentStartRequest",
    "AssessmentStartResponse",
    "AssessmentSubmitRequest",
    "AssessmentSaveRequest",
    "AssessmentAttemptResponse",
    "ExamAnalyticsResponse",
    "StudentAnalyticsResponse",
    "QuestionHeatmapResponse",
    "examination_router",
]
