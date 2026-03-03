"""
Enhanced Examination Router - Professional Features.

This module provides advanced API endpoints for:
- Enhanced question types (coding, fill-blanks, matching)
- Section-based exam management
- Comprehensive proctoring
- Import/Export functionality
- Advanced analytics and reporting
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload
import json

from app.core.database import get_db
from app.models.models import (
    User, College, Class, Batch, Exam, ExamQuestion, ExamTemplate,
    ExamSubmission, Assessment, AssessmentQuestion, AssessmentSubmission,
    Violation, ProctoringSnapshot, LiveMonitoringSession, MonitoringEvent,
    StudentProgressSnapshot, ExamStatusEnum, AssessmentStatusEnum,
    SubmissionStatusEnum, ExamTypeEnum, AssessmentTypeEnum,
    ViolationTypeEnum, ViolationSeverityEnum, QuestionTypeEnum
)
from app.shared.permissions import require_roles
from app.accounts.dependencies import get_current_user
from app.examination.schemas_enhanced import (
    # Enhanced schemas
    EnhancedExamCreate, EnhancedExamUpdate, EnhancedExamResponse,
    EnhancedExamQuestionCreate, EnhancedExamQuestionResponse,
    ExamSectionCreate, ExamSectionResponse,
    EnhancedExamStartRequest, EnhancedExamStartResponse,
    EnhancedExamSaveRequest, EnhancedExamSubmitRequest, EnhancedExamAttemptResponse,
    BulkQuestionImport, ImportExportResponse, QuestionExportRequest,
    EnhancedExamAnalyticsResponse, StudentDetailedAnalytics,
    EnhancedProctoringConfig, ProctoringEventCreate, ProctoringEventResponse,
    IDVerificationRequest, IDVerificationResponse,
    ExamResultSummary, DetailedExamResult, ExamLeaderboardResponse,
    LeaderboardEntry, QuestionAnalytics
)

router = APIRouter(
    prefix="/api/v1/examination/enhanced",
    tags=["Examination Enhanced"]
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_college_id(current_user: User = Depends(get_current_user)) -> UUID:
    """Get college ID from current user."""
    if current_user.college_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No college assigned to this user"
        )
    return current_user.college_id


def calculate_grade(percentage: float) -> str:
    """Calculate grade from percentage."""
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B"
    elif percentage >= 60:
        return "C"
    elif percentage >= 50:
        return "D"
    elif percentage >= 40:
        return "E"
    else:
        return "F"


def calculate_statistics(scores: List[float]) -> Dict[str, float]:
    """Calculate statistical measures for a list of scores."""
    if not scores:
        return {"mean": 0, "median": 0, "std_dev": 0, "min": 0, "max": 0}
    
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    mean = sum(sorted_scores) / n
    
    # Median
    if n % 2 == 0:
        median = (sorted_scores[n//2 - 1] + sorted_scores[n//2]) / 2
    else:
        median = sorted_scores[n//2]
    
    # Standard deviation
    variance = sum((x - mean) ** 2 for x in sorted_scores) / n
    std_dev = variance ** 0.5
    
    return {
        "mean": round(mean, 2),
        "median": round(median, 2),
        "std_dev": round(std_dev, 2),
        "min": min(sorted_scores),
        "max": max(sorted_scores)
    }


# =============================================================================
# ENHANCED EXAM MANAGEMENT
# =============================================================================

@router.post("/exams", response_model=EnhancedExamResponse, status_code=status.HTTP_201_CREATED)
async def create_enhanced_exam(
    exam: EnhancedExamCreate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new professional exam with enhanced features."""
    # Validate scheduling
    if exam.scheduled_at and exam.scheduled_end_at:
        if exam.scheduled_end_at <= exam.scheduled_at:
            raise HTTPException(
                status_code=400,
                detail="End time must be after start time"
            )
    
    # Calculate passing marks if percentage provided
    passing_marks = exam.passing_marks
    if passing_marks is None and exam.passing_percentage and exam.total_marks:
        passing_marks = int(exam.total_marks * exam.passing_percentage / 100)
    
    # Create exam with enhanced fields
    db_exam = Exam(
        college_id=college_id,
        created_by=current_user.id,
        title=exam.title,
        description=exam.description,
        exam_type=ExamTypeEnum(exam.exam_type) if exam.exam_type else ExamTypeEnum.MCQ,
        course_id=exam.course_id,
        exam_template_id=exam.exam_template_id,
        scheduled_at=exam.scheduled_at,
        duration_minutes=exam.duration_minutes,
        total_marks=exam.total_marks,
        passing_marks=passing_marks,
        is_immediate=exam.is_immediate,
        max_attempts=exam.max_attempts,
        instructions=exam.instructions,
        proctoring_config=exam.proctoring_config if exam.proctoring_enabled else None,
        status=ExamStatusEnum.DRAFT
    )
    
    db.add(db_exam)
    await db.commit()
    await db.refresh(db_exam)
    
    return EnhancedExamResponse.model_validate(db_exam)


@router.get("/exams", response_model=List[EnhancedExamResponse])
async def list_enhanced_exams(
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by status"),
    course_id: Optional[UUID] = Query(None, description="Filter by course"),
    search: Optional[str] = Query(None, description="Search by title"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """List exams with enhanced filtering and search."""
    query = select(Exam).where(Exam.college_id == college_id)
    
    if status:
        query = query.where(Exam.status == ExamStatusEnum(status))
    
    if course_id:
        query = query.where(Exam.course_id == course_id)
    
    if search:
        query = query.where(Exam.title.ilike(f"%{search}%"))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(desc(Exam.created_at)).offset(offset).limit(limit)
    
    result = await db.execute(query.options(selectinload(Exam.questions)))
    exams = result.scalars().all()
    
    # Enhance with computed fields
    exam_responses = []
    for exam in exams:
        exam_dict = EnhancedExamResponse.model_validate(exam)
        exam_dict.question_count = len(exam.questions) if exam.questions else 0
        exam_responses.append(exam_dict)
    
    return exam_responses


@router.get("/exams/{exam_id}", response_model=EnhancedExamResponse)
async def get_enhanced_exam(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """Get exam details with enhanced information."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        ).options(selectinload(Exam.questions), selectinload(Exam.submissions))
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam_response = EnhancedExamResponse.model_validate(exam)
    exam_response.question_count = len(exam.questions) if exam.questions else 0
    exam_response.submitted_count = len(exam.submissions) if exam.submissions else 0
    
    return exam_response


@router.patch("/exams/{exam_id}", response_model=EnhancedExamResponse)
async def update_enhanced_exam(
    exam_id: UUID,
    exam_update: EnhancedExamUpdate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Update exam with enhanced fields."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Validate status transitions
    if exam_update.status:
        valid_transitions = {
            ExamStatusEnum.DRAFT: [ExamStatusEnum.SCHEDULED, ExamStatusEnum.CANCELLED],
            ExamStatusEnum.SCHEDULED: [ExamStatusEnum.ONGOING, ExamStatusEnum.CANCELLED],
            ExamStatusEnum.ONGOING: [ExamStatusEnum.COMPLETED],
        }
        current_status = exam.status
        new_status = ExamStatusEnum(exam_update.status)
        
        if current_status in valid_transitions and new_status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from {current_status.value} to {new_status.value}"
            )
        
        exam.status = new_status
    
    # Update other fields
    update_data = exam_update.model_dump(exclude_unset=True, exclude={'status'})
    for key, value in update_data.items():
        if hasattr(exam, key):
            setattr(exam, key, value)
    
    await db.commit()
    await db.refresh(exam)
    
    return EnhancedExamResponse.model_validate(exam)


# =============================================================================
# ENHANCED QUESTION MANAGEMENT
# =============================================================================

@router.post("/exams/{exam_id}/questions/enhanced", response_model=EnhancedExamQuestionResponse)
async def create_enhanced_question(
    exam_id: UUID,
    question: EnhancedExamQuestionCreate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Create an enhanced question with advanced types."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatusEnum.DRAFT:
        raise HTTPException(status_code=400, detail="Can only add questions to draft exams")
    
    # Validate question type
    valid_types = ["mcq", "true_false", "short_answer", "essay", "coding", "fill_blanks", "matching"]
    if question.question_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid question type. Must be one of: {valid_types}")
    
    # Create enhanced question
    db_question = ExamQuestion(
        exam_id=exam_id,
        question_text=question.question_text,
        question_type=QuestionTypeEnum(question.question_type) if question.question_type in ["mcq", "true_false", "short_answer", "essay"] else QuestionTypeEnum.MCQ,
        options=question.options,
        correct_answer=question.correct_answer,
        marks=question.marks,
        negative_marks=question.negative_marks,
        section=question.section,
        order_index=question.order_index
    )
    
    # Store enhanced fields in options JSON
    enhanced_data = {}
    if question.media:
        enhanced_data["media"] = [m.model_dump() for m in question.media]
    if question.explanation:
        enhanced_data["explanation"] = question.explanation
    if question.hint:
        enhanced_data["hint"] = question.hint
    if question.difficulty:
        enhanced_data["difficulty"] = question.difficulty
    if question.tags:
        enhanced_data["tags"] = question.tags
    if question.coding_config:
        enhanced_data["coding_config"] = question.coding_config.model_dump()
    if question.fill_blanks_config:
        enhanced_data["fill_blanks_config"] = question.fill_blanks_config.model_dump()
    if question.matching_config:
        enhanced_data["matching_config"] = question.matching_config.model_dump()
    
    if enhanced_data:
        if db_question.options is None:
            db_question.options = {}
        if isinstance(db_question.options, dict):
            db_question.options["_enhanced"] = enhanced_data
        else:
            db_question.options = {"_enhanced": enhanced_data}
    
    db.add(db_question)
    await db.commit()
    await db.refresh(db_question)
    
    return EnhancedExamQuestionResponse.model_validate(db_question)


@router.post("/exams/{exam_id}/questions/import", response_model=ImportExportResponse)
async def import_questions(
    exam_id: UUID,
    import_data: BulkQuestionImport,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Import questions in bulk from various formats."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatusEnum.DRAFT:
        raise HTTPException(status_code=400, detail="Can only import to draft exams")
    
    created_count = 0
    errors = []
    
    for idx, q_data in enumerate(import_data.questions):
        try:
            db_question = ExamQuestion(
                exam_id=exam_id,
                question_text=q_data.question_text,
                question_type=QuestionTypeEnum(q_data.question_type) if q_data.question_type in ["mcq", "true_false", "short_answer", "essay"] else QuestionTypeEnum.MCQ,
                options=q_data.options,
                correct_answer=q_data.correct_answer,
                marks=q_data.marks,
                section=q_data.section,
                order_index=idx
            )
            
            # Add enhanced metadata
            enhanced = {
                "difficulty": q_data.difficulty,
                "tags": q_data.tags or []
            }
            
            if isinstance(db_question.options, dict):
                db_question.options["_enhanced"] = enhanced
            else:
                db_question.options = {"_enhanced": enhanced}
            
            db.add(db_question)
            created_count += 1
        except Exception as e:
            errors.append({"index": idx, "error": str(e)})
    
    await db.commit()
    
    return ImportExportResponse(
        success=len(errors) == 0,
        message=f"Imported {created_count} questions successfully",
        processed_count=created_count,
        error_count=len(errors),
        errors=errors if errors else None
    )


# =============================================================================
# EXAM ANALYTICS
# =============================================================================

@router.get("/exams/{exam_id}/analytics", response_model=EnhancedExamAnalyticsResponse)
async def get_exam_analytics(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive analytics for an exam."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get all submissions
    submissions_result = await db.execute(
        select(ExamSubmission).where(ExamSubmission.exam_id == exam_id)
    )
    submissions = submissions_result.scalars().all()
    
    # Calculate statistics
    scores = []
    completion_times = []
    total_violations = 0
    students_with_violations = 0
    
    for sub in submissions:
        if sub.total_obtained is not None:
            scores.append(sub.total_obtained)
        if sub.submitted_at and sub.started_at:
            duration = (sub.submitted_at - sub.started_at).total_seconds() / 60
            completion_times.append(duration)
        total_violations += sub.violation_count or 0
        if sub.violation_count and sub.violation_count > 0:
            students_with_violations += 1
    
    stats = calculate_statistics(scores)
    
    # Calculate pass rate
    passing_count = sum(1 for s in scores if exam.passing_marks and s >= exam.passing_marks)
    
    # Score distribution
    score_dist = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for score in scores:
        pct = (score / (exam.total_marks or 100)) * 100
        if pct <= 20:
            score_dist["0-20"] += 1
        elif pct <= 40:
            score_dist["21-40"] += 1
        elif pct <= 60:
            score_dist["41-60"] += 1
        elif pct <= 80:
            score_dist["61-80"] += 1
        else:
            score_dist["81-100"] += 1
    
    # Get questions for question analytics
    questions_result = await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam_id)
    )
    questions = questions_result.scalars().all()
    
    question_analytics = []
    for q in questions:
        qa = QuestionAnalytics(
            question_id=q.id,
            question_text=q.question_text[:100],
            question_type=q.question_type.value,
            marks=q.marks,
            attempts_count=len(submissions),
            correct_count=0,  # Would need detailed answer analysis
            incorrect_count=0,
            skipped_count=0,
            accuracy_rate=0.0,
            avg_time_seconds=None,
            difficulty_index=0.5,
            discrimination_index=0.5,
            option_distribution=None
        )
        question_analytics.append(qa)
    
    return EnhancedExamAnalyticsResponse(
        exam_id=exam_id,
        exam_title=exam.title,
        total_registered=0,  # Would need enrollment data
        total_attempted=len(submissions),
        total_submitted=sum(1 for s in submissions if s.submitted_at),
        completion_rate=len([s for s in submissions if s.submitted_at]) / len(submissions) * 100 if submissions else 0,
        avg_score=stats["mean"],
        median_score=stats["median"],
        max_score=stats["max"],
        min_score=stats["min"],
        std_deviation=stats["std_dev"],
        passing_count=passing_count,
        failing_count=len(scores) - passing_count,
        pass_rate=(passing_count / len(scores) * 100) if scores else 0,
        avg_completion_time_minutes=sum(completion_times) / len(completion_times) if completion_times else 0,
        on_time_submissions=len(submissions),
        late_submissions=0,
        total_violations=total_violations,
        avg_violations_per_student=total_violations / len(submissions) if submissions else 0,
        students_with_violations=students_with_violations,
        section_analytics=[],  # Would need section data
        question_analytics=question_analytics,
        score_distribution=score_dist,
        time_distribution={}
    )


@router.get("/exams/{exam_id}/leaderboard", response_model=ExamLeaderboardResponse)
async def get_exam_leaderboard(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100)
):
    """Get leaderboard for an exam."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get completed submissions with scores
    submissions_result = await db.execute(
        select(ExamSubmission, User)
        .join(User, ExamSubmission.student_id == User.id)
        .where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.status == SubmissionStatusEnum.SUBMITTED,
                ExamSubmission.total_obtained.isnot(None)
            )
        )
        .order_by(desc(ExamSubmission.total_obtained), asc(ExamSubmission.submitted_at))
        .limit(limit)
    )
    
    entries = []
    user_rank = None
    user_entry = None
    
    for rank, (submission, student) in enumerate(submissions_result.all(), 1):
        entry = LeaderboardEntry(
            rank=rank,
            student_id=student.id,
            student_name=student.full_name or student.email,
            obtained_marks=submission.total_obtained,
            percentage=(submission.total_obtained / (exam.total_marks or 100)) * 100,
            completion_time_minutes=(submission.submitted_at - submission.started_at).total_seconds() / 60 if submission.submitted_at else 0,
            submitted_at=submission.submitted_at
        )
        entries.append(entry)
        
        if student.id == current_user.id:
            user_rank = rank
            user_entry = entry
    
    return ExamLeaderboardResponse(
        exam_id=exam_id,
        exam_title=exam.title,
        total_participants=len(entries),
        entries=entries,
        user_rank=user_rank,
        user_entry=user_entry
    )


# =============================================================================
# EXAM RESULTS
# =============================================================================

@router.get("/exams/{exam_id}/results/{attempt_id}", response_model=DetailedExamResult)
async def get_detailed_result(
    exam_id: UUID,
    attempt_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed results for a specific attempt."""
    # Verify exam and attempt
    result = await db.execute(
        select(ExamSubmission, Exam, User)
        .join(Exam, ExamSubmission.exam_id == Exam.id)
        .join(User, ExamSubmission.student_id == User.id)
        .where(
            and_(
                ExamSubmission.id == attempt_id,
                Exam.id == exam_id,
                Exam.college_id == college_id
            )
        )
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    submission, exam, student = row
    
    # Students can only view their own results
    if current_user.role.value == "student" and submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot view other students' results")
    
    # Build summary
    percentage = (submission.total_obtained / exam.total_marks * 100) if exam.total_marks and submission.total_obtained else 0
    
    summary = ExamResultSummary(
        attempt_id=attempt_id,
        exam_id=exam_id,
        exam_title=exam.title,
        total_marks=exam.total_marks or 0,
        obtained_marks=submission.total_obtained or 0,
        percentage=round(percentage, 2),
        grade=calculate_grade(percentage),
        is_passed=exam.passing_marks is not None and (submission.total_obtained or 0) >= exam.passing_marks,
        rank=None,
        total_participants=0,
        percentile=None,
        completion_time_minutes=(submission.submitted_at - submission.started_at).total_seconds() / 60 if submission.submitted_at else 0,
        avg_time_per_question=0,
        class_average=0,
        class_highest=0,
        class_lowest=0
    )
    
    # Get all submissions for class stats
    all_submissions_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.total_obtained.isnot(None)
            )
        )
    )
    all_scores = [s.total_obtained for s in all_submissions_result.scalars().all() if s.total_obtained]
    
    if all_scores:
        summary.total_participants = len(all_scores)
        summary.class_average = round(sum(all_scores) / len(all_scores), 2)
        summary.class_highest = max(all_scores)
        summary.class_lowest = min(all_scores)
        
        # Calculate rank and percentile
        sorted_scores = sorted(all_scores, reverse=True)
        if submission.total_obtained in sorted_scores:
            rank = sorted_scores.index(submission.total_obtained) + 1
            summary.rank = rank
            summary.percentile = round((len(all_scores) - rank) / len(all_scores) * 100, 2)
    
    return DetailedExamResult(
        summary=summary,
        section_results=[],
        question_results=[],
        strong_areas=[],
        weak_areas=[],
        time_analysis={},
        recommendations=[]
    )


# =============================================================================
# PROCTORING ENDPOINTS
# =============================================================================

@router.post("/attempts/{attempt_id}/proctoring/event", response_model=ProctoringEventResponse)
async def report_proctoring_event(
    attempt_id: UUID,
    event: ProctoringEventCreate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Report a proctoring event from the client."""
    # Verify attempt belongs to user
    result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Create violation record for significant events
    if event.severity in ["medium", "high", "critical"]:
        violation = Violation(
            exam_submission_id=attempt_id,
            violation_type=ViolationTypeEnum(event.event_type) if event.event_type in [v.value for v in ViolationTypeEnum] else ViolationTypeEnum.TAB_SWITCH,
            severity=ViolationSeverityEnum(event.severity) if event.severity in [v.value for v in ViolationSeverityEnum] else ViolationSeverityEnum.MEDIUM,
            details=event.details
        )
        db.add(violation)
        
        # Update submission violation count
        submission.violation_count = (submission.violation_count or 0) + 1
    
    await db.commit()
    
    return ProctoringEventResponse(
        id=UUID(int=0),  # Would return actual ID
        attempt_id=attempt_id,
        event_type=event.event_type,
        severity=event.severity,
        details=event.details,
        screenshot_url=event.screenshot_url,
        timestamp=event.timestamp,
        acknowledged=False,
        acknowledged_by=None,
        acknowledged_at=None
    )


@router.get("/exams/{exam_id}/proctoring/live-monitoring")
async def get_live_monitoring_data(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get live monitoring data for an ongoing exam."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get active attempts
    attempts_result = await db.execute(
        select(ExamSubmission, User)
        .join(User, ExamSubmission.student_id == User.id)
        .where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
            )
        )
    )
    
    active_students = []
    for submission, student in attempts_result.all():
        active_students.append({
            "student_id": str(student.id),
            "student_name": student.full_name or student.email,
            "started_at": submission.started_at.isoformat(),
            "violation_count": submission.violation_count or 0,
            "status": "active",
            "ip_address": submission.ip_address
        })
    
    # Get recent violations
    violations_result = await db.execute(
        select(Violation, ExamSubmission, User)
        .join(ExamSubmission, Violation.exam_submission_id == ExamSubmission.id)
        .join(User, ExamSubmission.student_id == User.id)
        .where(ExamSubmission.exam_id == exam_id)
        .order_by(desc(Violation.created_at))
        .limit(20)
    )
    
    recent_violations = []
    for violation, sub, student in violations_result.all():
        recent_violations.append({
            "id": str(violation.id),
            "student_name": student.full_name or student.email,
            "violation_type": violation.violation_type.value,
            "severity": violation.severity.value,
            "timestamp": violation.created_at.isoformat(),
            "acknowledged": violation.acknowledged
        })
    
    return {
        "exam_id": str(exam_id),
        "exam_title": exam.title,
        "active_students": active_students,
        "active_count": len(active_students),
        "recent_violations": recent_violations,
        "total_violations": len(recent_violations)
    }


@router.post("/exams/{exam_id}/proctoring/terminate/{student_id}")
async def terminate_student_exam(
    exam_id: UUID,
    student_id: UUID,
    reason: str = Query(..., description="Reason for termination"),
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Terminate a student's exam attempt (for proctoring)."""
    # Find active attempt
    result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.student_id == student_id,
                ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
            )
        )
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="No active attempt found")
    
    # Terminate the attempt
    submission.status = SubmissionStatusEnum.TERMINATED
    submission.submitted_at = datetime.utcnow()
    
    # Add termination violation
    violation = Violation(
        exam_submission_id=submission.id,
        violation_type=ViolationTypeEnum.TAB_SWITCH,
        severity=ViolationSeverityEnum.HIGH,
        details={"reason": reason, "terminated_by": str(current_user.id)}
    )
    db.add(violation)
    
    await db.commit()
    
    return {
        "message": "Student exam terminated successfully",
        "attempt_id": str(submission.id),
        "reason": reason
    }


# =============================================================================
# EXAM ATTEMPT ENDPOINTS
# =============================================================================

@router.post("/exams/{exam_id}/start-enhanced", response_model=EnhancedExamStartResponse)
async def start_enhanced_exam(
    exam_id: UUID,
    request: EnhancedExamStartRequest,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Start an exam with enhanced features."""
    # Get exam
    exam_result = await db.execute(
        select(Exam).where(Exam.id == exam_id)
        .options(selectinload(Exam.questions))
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check password if required
    if hasattr(exam, 'require_password') and exam.require_password:
        stored_password = getattr(exam, 'password', None)
        if stored_password and request.password != stored_password:
            raise HTTPException(status_code=403, detail="Invalid exam password")
    
    # Check exam status and timing
    if exam.status not in [ExamStatusEnum.SCHEDULED, ExamStatusEnum.ONGOING]:
        raise HTTPException(status_code=400, detail="Exam is not available")
    
    if not exam.is_immediate and exam.scheduled_at and exam.scheduled_at > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Exam has not started yet")
    
    # Check max attempts
    attempts_result = await db.execute(
        select(func.count(ExamSubmission.id)).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    attempts_count = attempts_result.scalar()
    
    if exam.max_attempts and attempts_count >= exam.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts exceeded")
    
    # Check for existing in-progress attempt
    existing_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.student_id == current_user.id,
                ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
            )
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        # Resume existing attempt
        attempt_id = existing.id
        started_at = existing.started_at
    else:
        # Create new attempt
        new_submission = ExamSubmission(
            exam_id=exam_id,
            student_id=current_user.id,
            status=SubmissionStatusEnum.IN_PROGRESS,
            started_at=datetime.utcnow(),
            device_fingerprint=request.device_fingerprint,
            ip_address=request.ip_address,
            user_agent=request.user_agent
        )
        db.add(new_submission)
        await db.commit()
        await db.refresh(new_submission)
        attempt_id = new_submission.id
        started_at = new_submission.started_at
        
        # Update exam status to ongoing if first attempt
        if exam.status == ExamStatusEnum.SCHEDULED:
            exam.status = ExamStatusEnum.ONGOING
            await db.commit()
    
    # Calculate end time
    duration = exam.duration_minutes or 60
    ends_at = started_at + timedelta(minutes=duration)
    
    # Prepare questions (hide correct answers)
    questions_data = []
    for q in exam.questions or []:
        q_data = EnhancedExamQuestionResponse.model_validate(q)
        q_data.correct_answer = None  # Hide correct answer
        
        # Extract enhanced data if present
        if q.options and isinstance(q.options, dict) and "_enhanced" in q.options:
            enhanced = q.options["_enhanced"]
            if "media" in enhanced:
                q_data.media = [QuestionMedia(**m) for m in enhanced["media"]]
            if "explanation" in enhanced:
                q_data.explanation = enhanced["explanation"]
            if "hint" in enhanced:
                q_data.hint = enhanced["hint"]
            if "difficulty" in enhanced:
                q_data.difficulty = enhanced["difficulty"]
            if "tags" in enhanced:
                q_data.tags = enhanced["tags"]
        
        questions_data.append(q_data)
    
    return EnhancedExamStartResponse(
        attempt_id=attempt_id,
        exam_id=exam_id,
        exam_title=exam.title,
        duration_minutes=duration,
        started_at=started_at,
        ends_at=ends_at,
        total_marks=exam.total_marks or 0,
        passing_marks=exam.passing_marks or 0,
        question_count=len(questions_data),
        sections=[],
        questions=questions_data,
        allow_navigation=getattr(exam, 'allow_navigation', True),
        allow_review=getattr(exam, 'allow_review', False),
        shuffle_questions=getattr(exam, 'shuffle_questions', False),
        shuffle_options=getattr(exam, 'shuffle_options', False),
        proctoring_enabled=exam.proctoring_config is not None,
        proctoring_config=EnhancedProctoringConfig(**exam.proctoring_config) if exam.proctoring_config else None,
        welcome_message=getattr(exam, 'welcome_message', None),
        instructions=exam.instructions
    )


@router.post("/attempts/{attempt_id}/save-enhanced")
async def save_enhanced_exam_progress(
    attempt_id: UUID,
    request: EnhancedExamSaveRequest,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Save exam progress with enhanced tracking."""
    result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id,
                ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
            )
        )
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Active attempt not found")
    
    # Update answers
    if request.answers:
        if submission.answers is None:
            submission.answers = {}
        submission.answers.update(request.answers)
    
    await db.commit()
    
    return {
        "message": "Progress saved",
        "attempt_id": str(attempt_id),
        "saved_at": datetime.utcnow().isoformat()
    }


@router.post("/attempts/{attempt_id}/submit-enhanced", response_model=EnhancedExamAttemptResponse)
async def submit_enhanced_exam(
    attempt_id: UUID,
    request: EnhancedExamSubmitRequest,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Submit exam with enhanced processing."""
    result = await db.execute(
        select(ExamSubmission, Exam)
        .join(Exam, ExamSubmission.exam_id == Exam.id)
        .where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    submission, exam = row
    
    if submission.status != SubmissionStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Exam already submitted")
    
    # Auto-grade if possible
    total_obtained = 0
    if exam.exam_type == ExamTypeEnum.MCQ and exam.questions:
        for question in exam.questions:
            student_answer = request.answers.get(str(question.id))
            if student_answer and student_answer == question.correct_answer:
                total_obtained += question.marks
            elif student_answer and question.negative_marks:
                total_obtained -= question.negative_marks
    
    # Update submission
    submission.status = SubmissionStatusEnum.SUBMITTED
    submission.submitted_at = datetime.utcnow()
    submission.answers = request.answers
    submission.total_obtained = total_obtained
    
    await db.commit()
    await db.refresh(submission)
    
    return EnhancedExamAttemptResponse(
        id=submission.id,
        exam_id=exam.id,
        exam_title=exam.title,
        student_id=current_user.id,
        student_name=current_user.full_name or current_user.email,
        started_at=submission.started_at,
        submitted_at=submission.submitted_at,
        completion_time_minutes=(submission.submitted_at - submission.started_at).total_seconds() / 60,
        status=submission.status.value,
        total_marks=exam.total_marks or 0,
        obtained_marks=total_obtained,
        percentage=round(total_obtained / (exam.total_marks or 1) * 100, 2),
        is_passed=exam.passing_marks is not None and total_obtained >= exam.passing_marks,
        answers=submission.answers,
        graded_by=None,
        graded_by_name=None,
        graded_at=None,
        grading_notes=None,
        section_scores=[],
        violation_count=submission.violation_count or 0,
        is_cheating_flagged=(submission.violation_count or 0) >= 3,
        proctoring_review_status="pending",
        device_fingerprint=submission.device_fingerprint,
        ip_address=submission.ip_address,
        user_agent=submission.user_agent,
        created_at=submission.created_at,
        updated_at=submission.updated_at
    )
