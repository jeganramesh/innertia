"""
Examination and Assessment Router.

This module provides all API endpoints for:
- Batch management
- Exam templates
- Exam CRUD operations
- Assessment CRUD operations
- Exam attempt flow (start, submit, save)
- Assessment attempt flow
- Live monitoring
- Violation management
- Analytics
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import (
    User, College, Class, Batch, Exam, ExamQuestion, ExamTemplate,
    ExamSubmission, Assessment, AssessmentQuestion, AssessmentSubmission,
    Violation, ProctoringSnapshot, LiveMonitoringSession, MonitoringEvent,
    StudentProgressSnapshot, ExamStatusEnum, AssessmentStatusEnum,
    SubmissionStatusEnum, ExamTypeEnum, AssessmentTypeEnum
)
from app.shared.permissions import require_roles
from app.accounts.dependencies import get_current_user
from app.examination.schemas import (
    # Batch schemas
    BatchCreate, BatchUpdate, BatchResponse,
    # Exam Template schemas
    ExamTemplateCreate, ExamTemplateUpdate, ExamTemplateResponse,
    # Exam schemas
    ExamCreate, ExamUpdate, ExamResponse,
    ExamQuestionCreate, ExamQuestionUpdate, ExamQuestionResponse,
    BulkQuestionCreate, BulkQuestionResponse,
    # Exam Attempt schemas
    ExamStartRequest, ExamStartResponse, ExamSaveRequest, ExamSubmitRequest,
    ExamAttemptResponse,
    # Assessment schemas
    AssessmentCreate, AssessmentUpdate, AssessmentResponse,
    AssessmentQuestionCreate, AssessmentQuestionResponse,
    # Assessment Attempt schemas
    AssessmentStartRequest, AssessmentStartResponse, AssessmentSaveRequest,
    AssessmentSubmitRequest, AssessmentAttemptResponse,
    # Violation schemas
    ViolationCreate, ViolationResponse, ViolationAcknowledge, ViolationBulkAcknowledge,
    # Monitoring schemas
    LiveMonitoringSessionResponse, MonitoringEventResponse, ActiveStudentResponse,
    # Analytics schemas
    ExamAnalyticsResponse, StudentAnalyticsResponse, QuestionHeatmapResponse,
    # Paginated responses
    PaginatedExamResponse, PaginatedAssessmentResponse, PaginatedViolationResponse,
    PaginatedExamAttemptResponse,
    ProctoringConfig,
)


router = APIRouter(
    prefix="/api/v1/examination",
    tags=["Examination"]
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
) -> tuple:
    """Get pagination parameters."""
    offset = (page - 1) * limit
    return offset, limit, page


async def get_college_id(current_user: User = Depends(get_current_user)) -> UUID:
    """Get college ID from current user."""
    if current_user.college_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No college assigned to this user"
        )
    return current_user.college_id


# =============================================================================
# BATCH MANAGEMENT
# =============================================================================

@router.post("/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(
    batch: BatchCreate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new batch."""
    db_batch = Batch(
        college_id=college_id,
        name=batch.name,
        academic_year=batch.academic_year,
        start_date=batch.start_date,
        end_date=batch.end_date,
        is_active=batch.is_active
    )
    db.add(db_batch)
    await db.commit()
    await db.refresh(db_batch)
    return db_batch


@router.get("/batches", response_model=List[BatchResponse])
async def list_batches(
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db),
    is_active: Optional[bool] = Query(None, description="Filter by active status")
):
    """List all batches for the college."""
    query = select(Batch).where(Batch.college_id == college_id)
    
    if is_active is not None:
        query = query.where(Batch.is_active == is_active)
    
    result = await db.execute(query.order_by(Batch.created_at.desc()))
    batches = result.scalars().all()
    return batches


@router.get("/batches/{batch_id}", response_model=BatchResponse)
async def get_batch(
    batch_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get a batch by ID."""
    result = await db.execute(
        select(Batch).where(
            and_(Batch.id == batch_id, Batch.college_id == college_id)
        )
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.patch("/batches/{batch_id}", response_model=BatchResponse)
async def update_batch(
    batch_id: UUID,
    batch: BatchUpdate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a batch."""
    result = await db.execute(
        select(Batch).where(
            and_(Batch.id == batch_id, Batch.college_id == college_id)
        )
    )
    db_batch = result.scalar_one_or_none()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    update_data = batch.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_batch, key, value)
    
    await db.commit()
    await db.refresh(db_batch)
    return db_batch


# =============================================================================
# EXAM TEMPLATE MANAGEMENT
# =============================================================================

@router.post("/exam-templates", response_model=ExamTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_template(
    template: ExamTemplateCreate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new exam template."""
    proctoring_config = None
    if template.proctoring_config:
        proctoring_config = template.proctoring_config.model_dump()
    
    db_template = ExamTemplate(
        college_id=college_id,
        created_by=current_user.id,
        name=template.name,
        description=template.description,
        duration_minutes=template.duration_minutes,
        total_marks=template.total_marks,
        passing_marks=template.passing_marks,
        shuffle_questions=template.shuffle_questions,
        shuffle_options=template.shuffle_options,
        allow_navigation=template.allow_navigation,
        allow_review=template.allow_review,
        show_result_immediately=template.show_result_immediately,
        proctoring_config=proctoring_config
    )
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template


@router.get("/exam-templates", response_model=List[ExamTemplateResponse])
async def list_exam_templates(
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """List all exam templates for the college."""
    result = await db.execute(
        select(ExamTemplate).where(ExamTemplate.college_id == college_id)
        .order_by(ExamTemplate.created_at.desc())
    )
    templates = result.scalars().all()
    return templates


@router.get("/exam-templates/{template_id}", response_model=ExamTemplateResponse)
async def get_exam_template(
    template_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get an exam template by ID."""
    result = await db.execute(
        select(ExamTemplate).where(
            and_(ExamTemplate.id == template_id, ExamTemplate.college_id == college_id)
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.patch("/exam-templates/{template_id}", response_model=ExamTemplateResponse)
async def update_exam_template(
    template_id: UUID,
    template: ExamTemplateUpdate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Update an exam template."""
    result = await db.execute(
        select(ExamTemplate).where(
            and_(ExamTemplate.id == template_id, ExamTemplate.college_id == college_id)
        )
    )
    db_template = result.scalar_one_or_none()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template.model_dump(exclude_unset=True)
    if 'proctoring_config' in update_data and update_data['proctoring_config']:
        update_data['proctoring_config'] = update_data['proctoring_config'].model_dump()
    
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    await db.commit()
    await db.refresh(db_template)
    return db_template


@router.delete("/exam-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam_template(
    template_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Delete an exam template."""
    result = await db.execute(
        select(ExamTemplate).where(
            and_(ExamTemplate.id == template_id, ExamTemplate.college_id == college_id)
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await db.delete(template)
    await db.commit()
    return None


# =============================================================================
# EXAM CRUD OPERATIONS
# =============================================================================

@router.post("/exams", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam: ExamCreate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new exam."""
    proctoring_config = None
    if exam.proctoring_config:
        proctoring_config = exam.proctoring_config.model_dump()
    
    db_exam = Exam(
        college_id=college_id,
        created_by=current_user.id,
        title=exam.title,
        description=exam.description,
        exam_type=ExamTypeEnum(exam.exam_type),
        course_id=exam.course_id,
        exam_template_id=exam.exam_template_id,
        scheduled_at=exam.scheduled_at,
        duration_minutes=exam.duration_minutes,
        total_marks=exam.total_marks,
        passing_marks=exam.passing_marks,
        is_immediate=exam.is_immediate,
        max_attempts=exam.max_attempts,
        instructions=exam.instructions,
        proctoring_config=proctoring_config,
        status=ExamStatusEnum.DRAFT
    )
    db.add(db_exam)
    await db.commit()
    await db.refresh(db_exam)
    return db_exam


@router.get("/exams", response_model=PaginatedExamResponse)
async def list_exams(
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
    course_id: Optional[UUID] = Query(None, description="Filter by course"),
    exam_type: Optional[str] = Query(None, description="Filter by exam type")
):
    """List all exams for the college."""
    offset, limit, page = (page - 1) * limit, limit, page
    
    query = select(Exam).where(Exam.college_id == college_id)
    count_query = select(func.count(Exam.id)).where(Exam.college_id == college_id)
    
    if status:
        query = query.where(Exam.status == ExamStatusEnum(status))
        count_query = count_query.where(Exam.status == ExamStatusEnum(status))
    
    if course_id:
        query = query.where(Exam.course_id == course_id)
        count_query = count_query.where(Exam.course_id == course_id)
    
    if exam_type:
        query = query.where(Exam.exam_type == ExamTypeEnum(exam_type))
        count_query = count_query.where(Exam.exam_type == ExamTypeEnum(exam_type))
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    result = await db.execute(
        query.options(selectinload(Exam.questions))
        .order_by(Exam.created_at.desc())
        .offset(offset).limit(limit)
    )
    exams = result.scalars().all()
    
    # Add question count
    exam_responses = []
    for exam in exams:
        exam_dict = ExamResponse.model_validate(exam)
        exam_dict.question_count = len(exam.questions) if exam.questions else 0
        exam_responses.append(exam_dict)
    
    return PaginatedExamResponse(
        items=exam_responses,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.get("/exams/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """Get an exam by ID."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        ).options(selectinload(Exam.questions))
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam_response = ExamResponse.model_validate(exam)
    exam_response.question_count = len(exam.questions) if exam.questions else 0
    return exam_response


@router.patch("/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: UUID,
    exam: ExamUpdate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Update an exam."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    db_exam = result.scalar_one_or_none()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Don't allow updates if exam has started
    if db_exam.status not in [ExamStatusEnum.DRAFT, ExamStatusEnum.SCHEDULED]:
        raise HTTPException(
            status_code=400,
            detail="Cannot update exam that has already started"
        )
    
    update_data = exam.model_dump(exclude_unset=True)
    if 'proctoring_config' in update_data and update_data['proctoring_config']:
        update_data['proctoring_config'] = update_data['proctoring_config'].model_dump()
    
    for key, value in update_data.items():
        setattr(db_exam, key, value)
    
    await db.commit()
    await db.refresh(db_exam)
    return ExamResponse.model_validate(db_exam)


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Delete an exam (only if no attempts)."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check for attempts
    attempts_result = await db.execute(
        select(func.count(ExamSubmission.id))
        .where(ExamSubmission.exam_id == exam_id)
    )
    attempts_count = attempts_result.scalar()
    
    if attempts_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete exam with existing attempts"
        )
    
    await db.delete(exam)
    await db.commit()
    return None


@router.post("/exams/{exam_id}/publish", response_model=ExamResponse)
async def publish_exam(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Publish an exam (change status to scheduled)."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatusEnum.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft exams can be published")
    
    # Validate questions exist
    questions_result = await db.execute(
        select(func.count(ExamQuestion.id)).where(ExamQuestion.exam_id == exam_id)
    )
    questions_count = questions_result.scalar()
    
    if questions_count == 0:
        raise HTTPException(status_code=400, detail="Cannot publish exam without questions")
    
    exam.status = ExamStatusEnum.SCHEDULED
    await db.commit()
    await db.refresh(exam)
    return ExamResponse.model_validate(exam)


@router.post("/exams/{exam_id}/cancel", response_model=ExamResponse)
async def cancel_exam(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a scheduled exam."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status not in [ExamStatusEnum.DRAFT, ExamStatusEnum.SCHEDULED]:
        raise HTTPException(status_code=400, detail="Only draft or scheduled exams can be cancelled")
    
    exam.status = ExamStatusEnum.CANCELLED
    await db.commit()
    await db.refresh(exam)
    return ExamResponse.model_validate(exam)


# =============================================================================
# EXAM QUESTION MANAGEMENT
# =============================================================================

@router.post("/exams/{exam_id}/questions", response_model=ExamQuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_question(
    exam_id: UUID,
    question: ExamQuestionCreate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Add a question to an exam."""
    # Verify exam belongs to college
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status not in [ExamStatusEnum.DRAFT]:
        raise HTTPException(status_code=400, detail="Cannot add questions to published exams")
    
    db_question = ExamQuestion(
        exam_id=exam_id,
        question_text=question.question_text,
        question_type=question.question_type,
        options=question.options,
        correct_answer=question.correct_answer,
        marks=question.marks,
        negative_marks=question.negative_marks,
        section=question.section,
        order_index=question.order_index
    )
    db.add(db_question)
    await db.commit()
    await db.refresh(db_question)
    return db_question


@router.post("/exams/{exam_id}/questions/bulk", response_model=BulkQuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_bulk_exam_questions(
    exam_id: UUID,
    bulk_questions: BulkQuestionCreate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Add multiple questions to an exam at once."""
    # Verify exam belongs to college
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status not in [ExamStatusEnum.DRAFT]:
        raise HTTPException(status_code=400, detail="Cannot add questions to published exams")
    
    created_questions = []
    for idx, question in enumerate(bulk_questions.questions):
        db_question = ExamQuestion(
            exam_id=exam_id,
            question_text=question.question_text,
            question_type=question.question_type,
            options=question.options,
            correct_answer=question.correct_answer,
            marks=question.marks,
            negative_marks=question.negative_marks,
            section=question.section,
            order_index=question.order_index if question.order_index else idx
        )
        db.add(db_question)
        created_questions.append(db_question)
    
    await db.commit()
    for q in created_questions:
        await db.refresh(q)
    
    return BulkQuestionResponse(
        created=len(created_questions),
        questions=created_questions
    )


@router.get("/exams/{exam_id}/questions", response_model=List[ExamQuestionResponse])
async def list_exam_questions(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """List all questions for an exam."""
    # Verify exam exists
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    if not exam_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Exam not found")
    
    result = await db.execute(
        select(ExamQuestion)
        .where(ExamQuestion.exam_id == exam_id)
        .order_by(ExamQuestion.order_index)
    )
    questions = result.scalars().all()
    return questions


@router.patch("/exams/questions/{question_id}", response_model=ExamQuestionResponse)
async def update_exam_question(
    question_id: UUID,
    question: ExamQuestionUpdate,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Update an exam question."""
    result = await db.execute(
        select(ExamQuestion)
        .join(Exam)
        .where(
            and_(
                ExamQuestion.id == question_id,
                Exam.college_id == college_id
            )
        )
    )
    db_question = result.scalar_one_or_none()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check exam status
    exam_result = await db.execute(
        select(Exam).where(Exam.id == db_question.exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    if exam and exam.status not in [ExamStatusEnum.DRAFT]:
        raise HTTPException(status_code=400, detail="Cannot update questions in published exams")
    
    update_data = question.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_question, key, value)
    
    await db.commit()
    await db.refresh(db_question)
    return db_question


@router.delete("/exams/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam_question(
    question_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Delete an exam question."""
    result = await db.execute(
        select(ExamQuestion)
        .join(Exam)
        .where(
            and_(
                ExamQuestion.id == question_id,
                Exam.college_id == college_id
            )
        )
    )
    db_question = result.scalar_one_or_none()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check exam status
    exam_result = await db.execute(
        select(Exam).where(Exam.id == db_question.exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    if exam and exam.status not in [ExamStatusEnum.DRAFT]:
        raise HTTPException(status_code=400, detail="Cannot delete questions from published exams")
    
    await db.delete(db_question)
    await db.commit()
    return None


# =============================================================================
# EXAM ATTEMPT OPERATIONS
# =============================================================================

@router.post("/exams/{exam_id}/start", response_model=ExamStartResponse)
async def start_exam(
    exam_id: UUID,
    request: ExamStartRequest,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Start an exam attempt."""
    # Get exam
    exam_result = await db.execute(
        select(Exam).where(Exam.id == exam_id)
        .options(selectinload(Exam.questions))
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check exam status
    if exam.status not in [ExamStatusEnum.SCHEDULED, ExamStatusEnum.ONGOING]:
        raise HTTPException(status_code=400, detail="Exam is not available")
    
    # Check if immediate or scheduled time has passed
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
        raise HTTPException(status_code=400, detail="You have an in-progress attempt")
    
    # Create new attempt
    attempt = ExamSubmission(
        exam_id=exam_id,
        student_id=current_user.id,
        started_at=datetime.utcnow(),
        status=SubmissionStatusEnum.IN_PROGRESS,
        device_fingerprint=request.device_fingerprint,
        ip_address=request.ip_address,
        user_agent=request.user_agent
    )
    db.add(attempt)
    
    # Update exam status if scheduled
    if exam.status == ExamStatusEnum.SCHEDULED:
        exam.status = ExamStatusEnum.ONGOING
    
    await db.commit()
    await db.refresh(attempt)
    
    # Get questions (shuffle if needed)
    questions = list(exam.questions)
    if exam.shuffle_questions:
        import random
        random.shuffle(questions)
    
    # Build response
    question_responses = []
    for q in questions:
        q_resp = ExamQuestionResponse(
            id=q.id,
            exam_id=q.exam_id,
            question_text=q.question_text,
            question_type=q.question_type.value,
            options=q.options if not exam.shuffle_options else None,
            correct_answer=q.correct_answer if current_user.role == "faculty" else None,
            marks=q.marks,
            negative_marks=q.negative_marks,
            section=q.section,
            order_index=q.order_index,
            created_at=q.created_at,
            updated_at=q.updated_at,
            include_correct_answer=False
        )
        question_responses.append(q_resp)
    
    # Shuffle options if needed
    if exam.shuffle_options:
        import random
        for q in question_responses:
            if q.options:
                random.shuffle(q.options)
    
    return ExamStartResponse(
        attempt_id=attempt.id,
        exam_id=exam.id,
        duration_minutes=exam.duration_minutes or 60,
        total_marks=exam.total_marks or 0,
        passing_marks=exam.passing_marks or 0,
        questions=question_responses,
        started_at=attempt.started_at,
        allow_navigation=True,  # TODO: Get from template
        allow_review=False,  # TODO: Get from template
        shuffle_questions=exam.shuffle_questions,
        shuffle_options=exam.shuffle_options,
        proctoring_config=exam.proctoring_config
    )


@router.get("/exams/attempts/{attempt_id}/questions", response_model=List[ExamQuestionResponse])
async def get_attempt_questions(
    attempt_id: UUID,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Get questions for an exam attempt."""
    # Get attempt
    attempt_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.status != SubmissionStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Attempt is not in progress")
    
    # Get exam with questions
    exam_result = await db.execute(
        select(Exam).where(Exam.id == attempt.exam_id)
        .options(selectinload(Exam.questions))
    )
    exam = exam_result.scalar_one_or_none()
    
    # Get questions
    questions = list(exam.questions)
    if exam.shuffle_questions:
        import random
        random.shuffle(questions)
    
    return [
        ExamQuestionResponse(
            id=q.id,
            exam_id=q.exam_id,
            question_text=q.question_text,
            question_type=q.question_type.value,
            options=q.options,
            correct_answer=None,  # Never expose to student
            marks=q.marks,
            negative_marks=q.negative_marks,
            section=q.section,
            order_index=q.order_index,
            created_at=q.created_at,
            updated_at=q.updated_at,
            include_correct_answer=False
        )
        for q in questions
    ]


@router.post("/exams/attempts/{attempt_id}/save")
async def save_exam_answers(
    attempt_id: UUID,
    request: ExamSaveRequest,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Save exam answers (auto-save)."""
    attempt_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.status != SubmissionStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Attempt is not in progress")
    
    # Merge answers
    current_answers = attempt.answers or {}
    current_answers.update(request.answers)
    attempt.answers = current_answers
    
    await db.commit()
    return {"message": "Answers saved", "timestamp": datetime.utcnow()}


@router.post("/exams/attempts/{attempt_id}/submit", response_model=ExamAttemptResponse)
async def submit_exam(
    attempt_id: UUID,
    request: ExamSubmitRequest,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Submit an exam."""
    attempt_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.status != SubmissionStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Attempt is not in progress")
    
    # Get exam for auto-grading
    exam_result = await db.execute(
        select(Exam).where(Exam.id == attempt.exam_id)
        .options(selectinload(Exam.questions))
    )
    exam = exam_result.scalar_one_or_none()
    
    # Calculate score for auto-gradable questions
    total_obtained = 0
    answers = request.answers
    
    for question in exam.questions:
        if question.question_type in ['mcq', 'true_false']:
            student_answer = answers.get(str(question.id))
            if student_answer and question.correct_answer:
                if student_answer.lower() == question.correct_answer.lower():
                    total_obtained += question.marks
                elif question.negative_marks:
                    total_obtained -= question.negative_marks
    
    # Update attempt
    attempt.answers = answers
    attempt.submitted_at = datetime.utcnow()
    attempt.status = SubmissionStatusEnum.SUBMITTED
    attempt.total_obtained = max(0, total_obtained)
    
    await db.commit()
    await db.refresh(attempt)
    
    return ExamAttemptResponse.model_validate(attempt)


@router.get("/exams/attempts/{attempt_id}/status")
async def get_attempt_status(
    attempt_id: UUID,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Get exam attempt status."""
    attempt_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Calculate remaining time
    exam_result = await db.execute(select(Exam).where(Exam.id == attempt.exam_id))
    exam = exam_result.scalar_one_or_none()
    
    remaining_seconds = None
    if exam and exam.duration_minutes:
        elapsed = (datetime.utcnow() - attempt.started_at).total_seconds()
        remaining = (exam.duration_minutes * 60) - elapsed
        remaining_seconds = max(0, int(remaining))
    
    return {
        "attempt_id": attempt.id,
        "status": attempt.status.value,
        "violation_count": attempt.violation_count,
        "remaining_seconds": remaining_seconds,
        "is_cheating": attempt.is_cheating
    }


# =============================================================================
# EXAM RESULTS
# =============================================================================

@router.get("/exams/{exam_id}/results", response_model=ExamAnalyticsResponse)
async def get_exam_results(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get exam results and analytics."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get submissions
    submissions_result = await db.execute(
        select(ExamSubmission).where(ExamSubmission.exam_id == exam_id)
    )
    submissions = submissions_result.scalars().all()
    
    total_students = 0  # Would need enrollment data
    attempts_count = len(submissions)
    completed_count = sum(1 for s in submissions if s.status in [
        SubmissionStatusEnum.SUBMITTED, SubmissionStatusEnum.GRADED
    ])
    
    scores = [s.total_obtained for s in submissions if s.total_obtained is not None]
    avg_score = sum(scores) / len(scores) if scores else None
    highest_score = max(scores) if scores else None
    lowest_score = min(scores) if scores else None
    
    pass_count = sum(1 for s in submissions 
                     if s.total_obtained is not None 
                     and exam.passing_marks 
                     and s.total_obtained >= exam.passing_marks)
    fail_count = attempts_count - pass_count
    
    violation_count = sum(s.violation_count for s in submissions)
    flagged_count = sum(1 for s in submissions if s.is_cheating)
    
    return ExamAnalyticsResponse(
        exam_id=exam.id,
        exam_title=exam.title,
        total_students=total_students,
        attempts_count=attempts_count,
        completed_count=completed_count,
        avg_score=avg_score,
        highest_score=highest_score,
        lowest_score=lowest_score,
        pass_count=pass_count,
        fail_count=fail_count,
        pass_rate=(pass_count / attempts_count * 100) if attempts_count > 0 else None,
        avg_time_taken_minutes=None,  # TODO: Calculate
        violation_count=violation_count,
        flagged_cheating_count=flagged_count
    )


# =============================================================================
# VIOLATION MANAGEMENT
# =============================================================================

@router.post("/exams/attempts/{attempt_id}/violation", status_code=status.HTTP_201_CREATED)
async def report_violation(
    attempt_id: UUID,
    violation: ViolationCreate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Report a violation from client-side detection."""
    # Verify attempt belongs to student
    attempt_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.id == attempt_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Create violation
    db_violation = Violation(
        exam_submission_id=attempt_id,
        timestamp=datetime.utcnow(),
        violation_type=violation.violation_type,
        severity=violation.severity,
        details=violation.details
    )
    db.add(db_violation)
    
    # Update violation count
    attempt.violation_count += 1
    
    # Check if should auto-submit
    exam_result = await db.execute(
        select(Exam).where(Exam.id == attempt.exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    
    if exam and exam.proctoring_config:
        threshold = exam.proctoring_config.get('violation_threshold', 3)
        if attempt.violation_count >= threshold:
            attempt.status = SubmissionStatusEnum.AUTO_SUBMITTED
            attempt.submitted_at = datetime.utcnow()
            attempt.is_cheating = True
    
    await db.commit()
    return {"message": "Violation recorded", "violation_count": attempt.violation_count}


@router.get("/violations", response_model=PaginatedViolationResponse)
async def list_violations(
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    exam_id: Optional[UUID] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None)
):
    """List all violations."""
    offset, limit, page = (page - 1) * limit, limit, page
    
    query = select(Violation).join(ExamSubmission).join(Exam).where(
        Exam.college_id == college_id
    )
    count_query = select(func.count(Violation.id)).join(ExamSubmission).join(Exam).where(
        Exam.college_id == college_id
    )
    
    if exam_id:
        query = query.where(ExamSubmission.exam_id == exam_id)
        count_query = count_query.where(ExamSubmission.exam_id == exam_id)
    
    if acknowledged is not None:
        query = query.where(Violation.acknowledged == acknowledged)
        count_query = count_query.where(Violation.acknowledged == acknowledged)
    
    if severity:
        query = query.where(Violation.severity == severity)
        count_query = count_query.where(Violation.severity == severity)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    result = await db.execute(
        query.order_by(Violation.timestamp.desc())
        .offset(offset).limit(limit)
    )
    violations = result.scalars().all()
    
    return PaginatedViolationResponse(
        items=[ViolationResponse.model_validate(v) for v in violations],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.patch("/violations/{violation_id}/acknowledge", response_model=ViolationResponse)
async def acknowledge_violation(
    violation_id: UUID,
    data: ViolationAcknowledge,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Acknowledge a violation."""
    result = await db.execute(
        select(Violation).join(ExamSubmission).join(Exam).where(
            and_(Violation.id == violation_id, Exam.college_id == college_id)
        )
    )
    violation = result.scalar_one_or_none()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    violation.acknowledged = data.acknowledged
    await db.commit()
    await db.refresh(violation)
    return ViolationResponse.model_validate(violation)


@router.post("/violations/bulk-acknowledge")
async def bulk_acknowledge_violations(
    data: ViolationBulkAcknowledge,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Bulk acknowledge violations."""
    result = await db.execute(
        select(Violation).where(
            and_(
                Violation.id.in_(data.violation_ids),
                Violation.acknowledged == False
            )
        )
    )
    violations = result.scalars().all()
    
    for violation in violations:
        violation.acknowledged = data.acknowledged
    
    await db.commit()
    return {"updated": len(violations)}


# =============================================================================
# LIVE MONITORING
# =============================================================================

@router.get("/exams/{exam_id}/active-students", response_model=List[ActiveStudentResponse])
async def get_active_students(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get active students for an exam."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    if not exam_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get in-progress submissions
    result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
            )
        ).options(selectinload(ExamSubmission.student))
    )
    submissions = result.scalars().all()
    
    return [
        ActiveStudentResponse(
            student_id=s.student_id,
            student_name=s.student.full_name if s.student else None,
            started_at=s.started_at,
            violation_count=s.violation_count,
            status=s.status.value,
            ip_address=s.ip_address
        )
        for s in submissions
    ]


@router.post("/exams/{exam_id}/terminate-student/{student_id}")
async def terminate_student_attempt(
    exam_id: UUID,
    student_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Terminate a student's exam attempt."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    if not exam_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get submission
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
        raise HTTPException(status_code=404, detail="No in-progress attempt found")
    
    submission.status = SubmissionStatusEnum.TERMINATED
    submission.submitted_at = datetime.utcnow()
    submission.is_cheating = True
    submission.proctoring_notes = f"Terminated by faculty {current_user.id}"
    
    await db.commit()
    return {"message": "Student attempt terminated"}


@router.get("/exams/{exam_id}/monitoring-events", response_model=List[MonitoringEventResponse])
async def get_monitoring_events(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(100, ge=1, le=500)
):
    """Get monitoring events for an exam."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        )
    )
    if not exam_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Exam not found")
    
    result = await db.execute(
        select(MonitoringEvent).where(MonitoringEvent.exam_id == exam_id)
        .order_by(MonitoringEvent.created_at.desc())
        .limit(limit)
    )
    events = result.scalars().all()
    return events


# =============================================================================
# STUDENT EXAM LIST (For students)
# =============================================================================

@router.get("/student/exams", response_model=List[ExamResponse])
async def list_student_exams(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None)
):
    """List exams available to student."""
    query = select(Exam).where(
        Exam.college_id == current_user.college_id,
        Exam.status.in_([ExamStatusEnum.SCHEDULED, ExamStatusEnum.ONGOING])
    )
    
    if status:
        query = query.where(Exam.status == ExamStatusEnum(status))
    
    result = await db.execute(
        query.options(selectinload(Exam.questions))
        .order_by(Exam.scheduled_at.desc())
    )
    exams = result.scalars().all()
    return [ExamResponse.model_validate(e) for e in exams]


@router.get("/student/exams/{exam_id}/attempts", response_model=List[ExamAttemptResponse])
async def list_student_attempts(
    exam_id: UUID,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """List student's attempts for an exam."""
    result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.student_id == current_user.id
            )
        ).order_by(ExamSubmission.started_at.desc())
    )
    attempts = result.scalars().all()
    return [ExamAttemptResponse.model_validate(a) for a in attempts]


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics/department/{department_id}/progress")
async def get_department_progress(
    department_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get department progress analytics."""
    # Would implement aggregation of student progress
    return {"message": "Not implemented"}


@router.get("/analytics/students", response_model=List[StudentAnalyticsResponse])
async def list_student_analytics(
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db),
    department_id: Optional[UUID] = Query(None),
    batch_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """List students with analytics."""
    offset, limit, page = (page - 1) * limit, limit, page
    
    query = select(User).where(
        and_(
            User.college_id == college_id,
            User.role == "student",
            User.is_active == True
        )
    )
    
    if department_id:
        query = query.where(User.department_id == department_id)
    if batch_id:
        query = query.where(User.batch_id == batch_id)
    
    result = await db.execute(
        query.order_by(User.full_name)
        .offset(offset).limit(limit)
    )
    students = result.scalars().all()
    
    return [
        StudentAnalyticsResponse(
            student_id=s.id,
            student_name=s.full_name,
            exams_taken=0,  # TODO: Calculate
            assessments_taken=0,
            avg_exam_score=None,
            avg_assessment_score=None,
            total_violations=0,
            recent_attempts=[]
        )
        for s in students
    ]


@router.get("/analytics/students/{student_id}/detailed")
async def get_student_detailed_analytics(
    student_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed student analytics."""
    # Verify student belongs to college
    student_result = await db.execute(
        select(User).where(
            and_(
                User.id == student_id,
                User.college_id == college_id
            )
        )
    )
    if not student_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get exam submissions
    exam_result = await db.execute(
        select(ExamSubmission).where(ExamSubmission.student_id == student_id)
    )
    exam_submissions = exam_result.scalars().all()
    
    # Get assessment submissions
    assessment_result = await db.execute(
        select(AssessmentSubmission).where(AssessmentSubmission.student_id == student_id)
    )
    assessment_submissions = assessment_result.scalars().all()
    
    exam_scores = [s.total_obtained for s in exam_submissions if s.total_obtained]
    assessment_scores = [s.total_obtained for s in assessment_submissions if s.total_obtained]
    
    return {
        "student_id": student_id,
        "exam_submissions": len(exam_submissions),
        "assessment_submissions": len(assessment_submissions),
        "avg_exam_score": sum(exam_scores) / len(exam_scores) if exam_scores else None,
        "avg_assessment_score": sum(assessment_scores) / len(assessment_scores) if assessment_scores else None
    }


@router.get("/analytics/exams/{exam_id}/heatmap", response_model=List[QuestionHeatmapResponse])
async def get_question_heatmap(
    exam_id: UUID,
    college_id: UUID = Depends(get_college_id),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get question-wise performance heatmap."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == college_id)
        ).options(selectinload(Exam.questions))
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get submissions with answers
    submissions_result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.status.in_([SubmissionStatusEnum.SUBMITTED, SubmissionStatusEnum.GRADED])
            )
        )
    )
    submissions = submissions_result.scalars().all()
    
    heatmap = []
    for question in exam.questions:
        correct = 0
        incorrect = 0
        unanswered = 0
        total_marks = 0
        
        for submission in submissions:
            if not submission.answers:
                unanswered += 1
                continue
            
            answer = submission.answers.get(str(question.id))
            if answer is None:
                unanswered += 1
            elif question.question_type in ['mcq', 'true_false']:
                if answer.lower() == question.correct_answer.lower():
                    correct += 1
                    total_marks += question.marks
                else:
                    incorrect += 1
                    if question.negative_marks:
                        total_marks -= question.negative_marks
        
        total = correct + incorrect + unanswered
        heatmap.append(QuestionHeatmapResponse(
            question_id=question.id,
            question_text=question.question_text[:100] + "...",
            total_attempts=total,
            correct_count=correct,
            incorrect_count=incorrect,
            unanswered_count=unanswered,
            correct_percentage=(correct / total * 100) if total > 0 else 0,
            avg_marks_obtained=total_marks / total if total > 0 else 0
        ))
    
    return heatmap
