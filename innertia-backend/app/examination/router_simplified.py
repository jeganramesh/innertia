"""
Simplified Examination Router for Electron Desktop Application.

Practical features for desktop exam delivery:
- Simplified proctoring (no AI/ML)
- IP-based access control
- Live monitoring panel
- Real-time settings management
- Electron app compatibility
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, asc
from sqlalchemy.orm import selectinload
import ipaddress

from app.core.database import get_db
from app.core.redis import redis_client
from app.models.models import (
    User, Exam, ExamQuestion, ExamSubmission,
    SubmissionStatusEnum, ExamStatusEnum
)
from app.shared.permissions import require_roles
from app.accounts.dependencies import get_current_user
from app.examination.schemas_simplified import (
    SimplifiedExamCreate, SimplifiedExamResponse,
    SimplifiedProctoringConfig, IPRestrictionConfig,
    LiveExamSettings, LiveExamSettingsUpdate,
    LiveMonitoringSnapshot, StudentLiveStatus, MonitoringEvent,
    SimplifiedExamStartRequest, SimplifiedExamStartResponse,
    SimplifiedExamAttempt, ProctorAction, ProctorActionResponse,
    IPAuditLog, BulkIPUpdate
)

router = APIRouter(
    prefix="/api/v1/examination/desktop",
    tags=["Examination Desktop"]
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def check_ip_allowed(client_ip: str, config: IPRestrictionConfig) -> bool:
    """Check if client IP is allowed based on restrictions."""
    if not config.enabled:
        return True
    
    if config.allow_localhost and client_ip in ("127.0.0.1", "localhost", "::1"):
        return True
    
    if client_ip in config.blocked_ips:
        return False
    
    if not config.allowed_ips and not config.allowed_ranges:
        return True
    
    if client_ip in config.allowed_ips:
        return True
    
    try:
        client_addr = ipaddress.ip_address(client_ip)
        for range_str in config.allowed_ranges:
            if client_addr in ipaddress.ip_network(range_str, strict=False):
                return True
    except ValueError:
        pass
    
    return False


def calculate_progress(answers: dict, total_questions: int) -> float:
    """Calculate completion percentage."""
    if total_questions == 0:
        return 0.0
    answered = len([k for k, v in answers.items() if v is not None])
    return round((answered / total_questions) * 100, 2)


# =============================================================================
# EXAM MANAGEMENT
# =============================================================================

@router.post("/exams", response_model=SimplifiedExamResponse, status_code=status.HTTP_201_CREATED)
async def create_desktop_exam(
    exam: SimplifiedExamCreate,
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Create a simplified exam for desktop Electron app."""
    # Validate scheduling
    if exam.scheduled_at and exam.scheduled_end_at:
        if exam.scheduled_end_at <= exam.scheduled_at:
            raise HTTPException(400, "End time must be after start time")
    
    # Create exam
    db_exam = Exam(
        college_id=current_user.college_id,
        created_by=current_user.id,
        title=exam.title,
        description=exam.description,
        exam_type=exam.exam_type,
        scheduled_at=exam.scheduled_at,
        duration_minutes=exam.duration_minutes,
        total_marks=exam.total_marks,
        passing_marks=exam.passing_marks,
        max_attempts=exam.max_attempts,
        instructions=exam.instructions,
        status=ExamStatusEnum.DRAFT,
        # Store simplified config as JSON
        proctoring_config={
            "desktop": True,
            "simplified": exam.proctoring_config.model_dump(),
            "ip_restrictions": exam.ip_restrictions.model_dump(),
            "welcome_message": exam.welcome_message,
            "completion_message": exam.completion_message,
            "shuffle_questions": exam.shuffle_questions,
            "shuffle_options": exam.shuffle_options,
            "allow_navigation": exam.allow_navigation,
            "allow_review": exam.allow_review,
            "require_password": exam.require_password,
            "password": exam.password if exam.require_password else None
        }
    )
    
    db.add(db_exam)
    await db.commit()
    await db.refresh(db_exam)
    
    return SimplifiedExamResponse.model_validate(db_exam)


@router.get("/exams", response_model=List[SimplifiedExamResponse])
async def list_desktop_exams(
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """List exams optimized for desktop app."""
    query = select(Exam).where(Exam.college_id == current_user.college_id)
    
    if status:
        query = query.where(Exam.status == ExamStatusEnum(status))
    
    result = await db.execute(query.order_by(desc(Exam.created_at)))
    exams = result.scalars().all()
    
    return [SimplifiedExamResponse.model_validate(exam) for exam in exams]


@router.get("/exams/{exam_id}", response_model=SimplifiedExamResponse)
async def get_desktop_exam(
    exam_id: UUID,
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """Get exam details for desktop app."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == current_user.college_id)
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(404, "Exam not found")
    
    return SimplifiedExamResponse.model_validate(exam)


@router.patch("/exams/{exam_id}/settings", response_model=SimplifiedExamResponse)
async def update_exam_settings(
    exam_id: UUID,
    proctoring_config: Optional[SimplifiedProctoringConfig] = None,
    ip_restrictions: Optional[IPRestrictionConfig] = None,
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Update exam proctoring and IP settings."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == current_user.college_id)
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(404, "Exam not found")
    
    current_config = exam.proctoring_config or {}
    
    if proctoring_config:
        current_config["simplified"] = proctoring_config.model_dump()
    
    if ip_restrictions:
        current_config["ip_restrictions"] = ip_restrictions.model_dump()
    
    exam.proctoring_config = current_config
    await db.commit()
    await db.refresh(exam)
    
    return SimplifiedExamResponse.model_validate(exam)


# =============================================================================
# LIVE MONITORING PANEL
# =============================================================================

@router.get("/exams/{exam_id}/live-monitoring", response_model=LiveMonitoringSnapshot)
async def get_live_monitoring(
    exam_id: UUID,
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get live monitoring snapshot for exam."""
    # Get exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == current_user.college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(404, "Exam not found")
    
    # Get active submissions
    submissions_result = await db.execute(
        select(ExamSubmission, User)
        .join(User, ExamSubmission.student_id == User.id)
        .where(ExamSubmission.exam_id == exam_id)
    )
    
    students = []
    total_active = 0
    total_submitted = 0
    total_disconnected = 0
    total_tab_switches = 0
    
    for submission, user in submissions_result.all():
        # Calculate progress
        answers = submission.answers or {}
        progress = calculate_progress(answers, len(exam.questions) if exam.questions else 0)
        
        # Determine status
        is_online = submission.status == SubmissionStatusEnum.IN_PROGRESS
        if submission.status == SubmissionStatusEnum.SUBMITTED:
            student_status = "submitted"
            total_submitted += 1
        elif is_online:
            student_status = "in_progress"
            total_active += 1
        else:
            student_status = "disconnected"
            total_disconnected += 1
        
        # Get tab switch count from metadata
        tab_switches = 0
        warning_count = 0
        if submission.proctoring_config:
            tab_switches = submission.proctoring_config.get("tab_switch_count", 0)
            warning_count = submission.proctoring_config.get("warning_count", 0)
            total_tab_switches += tab_switches
        
        student = StudentLiveStatus(
            student_id=user.id,
            student_name=user.full_name or user.email,
            student_email=user.email,
            is_online=is_online,
            last_seen_at=submission.updated_at,
            connection_quality="good",
            status=student_status,
            questions_answered=len([v for v in answers.values() if v]),
            total_questions=len(exam.questions) if exam.questions else 0,
            progress_percentage=progress,
            started_at=submission.started_at,
            time_spent_minutes=(datetime.utcnow() - submission.started_at).total_seconds() / 60,
            time_remaining_minutes=exam.duration_minutes - ((datetime.utcnow() - submission.started_at).total_seconds() / 60) if exam.duration_minutes else 0,
            last_answer_saved_at=submission.updated_at,
            tab_switch_count=tab_switches,
            warning_count=warning_count,
            ip_address=submission.ip_address,
            is_ip_allowed=True  # Would check actual restrictions
        )
        students.append(student)
    
    # Get current settings from Redis (or default)
    settings = LiveExamSettings()
    ip_config = IPRestrictionConfig()
    if exam.proctoring_config:
        ip_config = IPRestrictionConfig(**exam.proctoring_config.get("ip_restrictions", {}))
    
    return LiveMonitoringSnapshot(
        exam_id=exam_id,
        exam_title=exam.title,
        generated_at=datetime.utcnow(),
        total_students=len(students),
        active_students=total_active,
        submitted_students=total_submitted,
        disconnected_students=total_disconnected,
        avg_time_remaining_minutes=sum(s.time_remaining_minutes for s in students) / len(students) if students else 0,
        min_time_remaining_minutes=min((s.time_remaining_minutes for s in students), default=0),
        total_tab_switches=total_tab_switches,
        total_warnings_issued=sum(s.warning_count for s in students),
        current_settings=settings,
        ip_restrictions=ip_config,
        students=students
    )


@router.post("/exams/{exam_id}/live-settings", response_model=LiveExamSettings)
async def update_live_settings(
    exam_id: UUID,
    settings: LiveExamSettingsUpdate,
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Update live exam settings in real-time."""
    # Verify exam
    exam_result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == current_user.college_id)
        )
    )
    exam = exam_result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(404, "Exam not found")
    
    # Store settings in Redis for real-time access
    settings_key = f"exam:{exam_id}:live_settings"
    current_settings = await redis_client.get(settings_key) or {}
    
    update_data = settings.model_dump(exclude_unset=True)
    current_settings.update(update_data)
    current_settings["updated_at"] = datetime.utcnow().isoformat()
    current_settings["updated_by"] = str(current_user.id)
    
    await redis_client.set(settings_key, current_settings, expire=3600 * 24)
    
    # Handle broadcast message
    if settings.broadcast_message:
        broadcast_key = f"exam:{exam_id}:broadcast"
        await redis_client.publish(broadcast_key, {
            "message": settings.broadcast_message,
            "timestamp": datetime.utcnow().isoformat(),
            "from": current_user.full_name or current_user.email
        })
    
    return LiveExamSettings(**current_settings)


@router.get("/exams/{exam_id}/live-settings", response_model=LiveExamSettings)
async def get_live_settings(
    exam_id: UUID,
    current_user: User = Depends(require_roles("college_admin", "faculty", "student")),
    db: AsyncSession = Depends(get_db)
):
    """Get current live exam settings."""
    settings_key = f"exam:{exam_id}:live_settings"
    settings = await redis_client.get(settings_key)
    
    if settings:
        return LiveExamSettings(**settings)
    
    return LiveExamSettings()


# =============================================================================
# PROCTOR ACTIONS
# =============================================================================

@router.post("/exams/{exam_id}/proctor-actions", response_model=ProctorActionResponse)
async def execute_proctor_action(
    exam_id: UUID,
    action: ProctorAction,
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Execute proctor action on a student."""
    # Get student's submission
    result = await db.execute(
        select(ExamSubmission).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.student_id == action.student_id,
                ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
            )
        )
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(404, "Active submission not found")
    
    # Get student info
    student_result = await db.execute(
        select(User).where(User.id == action.student_id)
    )
    student = student_result.scalar_one()
    
    message = ""
    
    if action.action_type == "warn":
        # Increment warning count
        proctoring_data = submission.proctoring_config or {}
        proctoring_data["warning_count"] = proctoring_data.get("warning_count", 0) + 1
        proctoring_data["last_warning"] = {
            "message": action.warning_message,
            "timestamp": datetime.utcnow().isoformat(),
            "by": str(current_user.id)
        }
        submission.proctoring_config = proctoring_data
        message = f"Warning sent: {action.warning_message}"
    
    elif action.action_type == "extend_time":
        # Store time extension
        proctoring_data = submission.proctoring_config or {}
        extensions = proctoring_data.get("time_extensions", [])
        extensions.append({
            "minutes": action.additional_minutes,
            "reason": action.reason,
            "timestamp": datetime.utcnow().isoformat()
        })
        proctoring_data["time_extensions"] = extensions
        submission.proctoring_config = proctoring_data
        message = f"Time extended by {action.additional_minutes} minutes"
    
    elif action.action_type == "force_submit":
        submission.status = SubmissionStatusEnum.SUBMITTED
        submission.submitted_at = datetime.utcnow()
        message = "Exam force submitted"
    
    elif action.action_type == "kick":
        submission.status = SubmissionStatusEnum.TERMINATED
        message = "Student removed from exam"
    
    await db.commit()
    
    # Publish action to Redis for real-time notification
    action_key = f"exam:{exam_id}:student:{action.student_id}:actions"
    await redis_client.publish(action_key, {
        "type": action.action_type,
        "reason": action.reason,
        "message": message,
        "by": current_user.full_name or current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return ProctorActionResponse(
        success=True,
        action_type=action.action_type,
        student_id=action.student_id,
        student_name=student.full_name or student.email,
        message=message,
        timestamp=datetime.utcnow()
    )


# =============================================================================
# IP MANAGEMENT
# =============================================================================

@router.post("/exams/{exam_id}/ip-restrictions", response_model=IPRestrictionConfig)
async def update_ip_restrictions(
    exam_id: UUID,
    config: IPRestrictionConfig,
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Update IP restrictions for exam."""
    result = await db.execute(
        select(Exam).where(
            and_(Exam.id == exam_id, Exam.college_id == current_user.college_id)
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(404, "Exam not found")
    
    current_config = exam.proctoring_config or {}
    current_config["ip_restrictions"] = config.model_dump()
    exam.proctoring_config = current_config
    
    await db.commit()
    
    return config


@router.get("/exams/{exam_id}/ip-logs", response_model=List[IPAuditLog])
async def get_ip_audit_logs(
    exam_id: UUID,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles("college_admin", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get IP access audit logs."""
    # This would query from an audit table
    # For now, returning empty list
    return []


# =============================================================================
# EXAM ATTEMPT (Desktop)
# =============================================================================

@router.post("/exams/{exam_id}/start", response_model=SimplifiedExamStartResponse)
async def start_desktop_exam(
    exam_id: UUID,
    request: SimplifiedExamStartRequest,
    client_ip: Optional[str] = Query(None),
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Start exam in desktop Electron app."""
    # Get exam
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id)
        .options(selectinload(Exam.questions))
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(404, "Exam not found")
    
    # Check status
    if exam.status not in [ExamStatusEnum.SCHEDULED, ExamStatusEnum.ONGOING]:
        raise HTTPException(400, "Exam is not available")
    
    # Check password
    exam_config = exam.proctoring_config or {}
    if exam_config.get("require_password"):
        stored_password = exam_config.get("password")
        if stored_password and request.password != stored_password:
            raise HTTPException(403, "Invalid exam password")
    
    # Check IP restrictions
    ip_config = IPRestrictionConfig(**exam_config.get("ip_restrictions", {}))
    if ip_config.enabled and client_ip:
        if not check_ip_allowed(client_ip, ip_config):
            raise HTTPException(403, "Access denied from this IP address")
    
    # Check attempts
    attempts_result = await db.execute(
        select(func.count(ExamSubmission.id)).where(
            and_(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.student_id == current_user.id
            )
        )
    )
    if attempts_result.scalar() >= exam.max_attempts:
        raise HTTPException(400, "Maximum attempts exceeded")
    
    # Check for existing in-progress
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
        attempt_id = existing.id
        started_at = existing.started_at
    else:
        # Create new submission
        new_submission = ExamSubmission(
            exam_id=exam_id,
            student_id=current_user.id,
            status=SubmissionStatusEnum.IN_PROGRESS,
            started_at=datetime.utcnow(),
            ip_address=client_ip,
            proctoring_config={
                "platform": request.platform,
                "screen_resolution": request.screen_resolution,
                "app_version": request.app_version,
                "tab_switch_count": 0,
                "warning_count": 0
            }
        )
        db.add(new_submission)
        await db.commit()
        await db.refresh(new_submission)
        attempt_id = new_submission.id
        started_at = new_submission.started_at
        
        if exam.status == ExamStatusEnum.SCHEDULED:
            exam.status = ExamStatusEnum.ONGOING
            await db.commit()
    
    # Prepare questions (hide answers)
    questions = []
    for q in exam.questions or []:
        q_data = {
            "id": str(q.id),
            "question_text": q.question_text,
            "question_type": q.question_type.value,
            "options": q.options,
            "marks": q.marks,
            "negative_marks": q.negative_marks,
            "order_index": q.order_index
        }
        questions.append(q_data)
    
    # Get proctoring config
    simplified_config = SimplifiedProctoringConfig()
    if exam_config and "simplified" in exam_config:
        simplified_config = SimplifiedProctoringConfig(**exam_config["simplified"])
    
    return SimplifiedExamStartResponse(
        attempt_id=attempt_id,
        exam_id=exam_id,
        exam_title=exam.title,
        duration_minutes=exam.duration_minutes or 60,
        started_at=started_at,
        ends_at=started_at + timedelta(minutes=exam.duration_minutes or 60),
        total_marks=exam.total_marks or 0,
        passing_marks=exam.passing_marks or 0,
        questions=questions,
        question_count=len(questions),
        proctoring_config=simplified_config,
        app_config={}  # Would be populated with actual config
    )


@router.post("/attempts/{attempt_id}/events")
async def report_desktop_event(
    attempt_id: UUID,
    event_type: str = Query(..., description="tab_switch|window_blur|idle_warning|auto_save"),
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Report events from desktop app."""
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
        raise HTTPException(404, "Attempt not found")
    
    proctoring_data = submission.proctoring_config or {}
    
    if event_type == "tab_switch":
        proctoring_data["tab_switch_count"] = proctoring_data.get("tab_switch_count", 0) + 1
        proctoring_data["last_tab_switch"] = datetime.utcnow().isoformat()
    
    elif event_type == "window_blur":
        proctoring_data["window_blur_count"] = proctoring_data.get("window_blur_count", 0) + 1
    
    elif event_type == "auto_save":
        proctoring_data["last_auto_save"] = datetime.utcnow().isoformat()
    
    submission.proctoring_config = proctoring_data
    await db.commit()
    
    return {"status": "recorded", "event_type": event_type}


# =============================================================================
# WEBSOCKET FOR REAL-TIME UPDATES
# =============================================================================

@router.websocket("/ws/exams/{exam_id}/monitor")
async def monitoring_websocket(
    websocket: WebSocket,
    exam_id: UUID,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """WebSocket for real-time monitoring updates."""
    await websocket.accept()
    
    try:
        # Subscribe to Redis channels for this exam
        channels = [
            f"exam:{exam_id}:broadcast",
            f"exam:{exam_id}:updates"
        ]
        
        while True:
            # This would integrate with Redis pub/sub for real-time updates
            data = await websocket.receive_text()
            # Echo back for now (would process and broadcast)
            await websocket.send_text(f"Received: {data}")
            
    except WebSocketDisconnect:
        pass
