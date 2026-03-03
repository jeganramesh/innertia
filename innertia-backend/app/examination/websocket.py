"""
WebSocket endpoints for real-time proctoring and monitoring.

This module provides:
- Student proctoring connection (/ws/exam/{attempt_id})
- Faculty monitoring connection (/ws/monitor/{exam_id})
"""

import json
import asyncio
from typing import Dict, Set
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.models import (
    ExamSubmission, Exam, MonitoringEvent, Violation,
    SubmissionStatusEnum, MonitoringEventTypeEnum
)


router = APIRouter()


# =============================================================================
# CONNECTION MANAGER
# =============================================================================

class ConnectionManager:
    """Manages WebSocket connections for exams."""
    
    def __init__(self):
        # exam_id -> set of faculty websockets
        self.exam_rooms: Dict[UUID, Set[WebSocket]] = {}
        # attempt_id -> student websocket
        self.student_connections: Dict[UUID, WebSocket] = {}
    
    async def connect_student(self, websocket: WebSocket, attempt_id: UUID):
        """Connect a student to their exam."""
        await websocket.accept()
        self.student_connections[attempt_id] = websocket
    
    def disconnect_student(self, attempt_id: UUID):
        """Disconnect a student from their exam."""
        if attempt_id in self.student_connections:
            del self.student_connections[attempt_id]
    
    async def connect_faculty(self, websocket: WebSocket, exam_id: UUID):
        """Connect a faculty to monitor an exam."""
        await websocket.accept()
        if exam_id not in self.exam_rooms:
            self.exam_rooms[exam_id] = set()
        self.exam_rooms[exam_id].add(websocket)
    
    def disconnect_faculty(self, websocket: WebSocket, exam_id: UUID):
        """Disconnect a faculty from monitoring an exam."""
        if exam_id in self.exam_rooms:
            self.exam_rooms[exam_id].discard(websocket)
            if not self.exam_rooms[exam_id]:
                del self.exam_rooms[exam_id]
    
    async def send_to_student(self, attempt_id: UUID, message: dict):
        """Send message to a specific student."""
        if attempt_id in self.student_connections:
            try:
                await self.student_connections[attempt_id].send_json(message)
            except Exception:
                self.disconnect_student(attempt_id)
    
    async def broadcast_to_faculty(self, exam_id: UUID, message: dict):
        """Broadcast message to all faculty monitoring an exam."""
        if exam_id in self.exam_rooms:
            disconnected = set()
            for websocket in self.exam_rooms[exam_id]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.add(websocket)
            # Clean up disconnected
            for ws in disconnected:
                self.exam_rooms[exam_id].discard(ws)


# Global connection manager
manager = ConnectionManager()


# =============================================================================
# STUDENT PROCTORING WEBSOCKET
# =============================================================================

@router.websocket("/ws/exam/{attempt_id}")
async def student_proctoring_websocket(
    websocket: WebSocket,
    attempt_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for student proctoring.
    
    Student connects to this endpoint during an exam.
    Sends:
    - Periodic heartbeat/ping
    - Face detection events
    - Tab switch events
    - Screen capture events (if enabled)
    
    Receives:
    - Violation alerts
    - Pause/resume commands
    - Time warnings
    """
    await manager.connect_student(websocket, attempt_id)
    
    try:
        # Get exam attempt info
        result = await db.execute(
            select(ExamSubmission).where(ExamSubmission.id == attempt_id)
        )
        attempt = result.scalar_one_or_none()
        
        if not attempt or attempt.status != SubmissionStatusEnum.IN_PROGRESS:
            await websocket.send_json({
                "type": "error",
                "message": "No active attempt found"
            })
            await websocket.close()
            return
        
        exam_id = attempt.exam_id
        
        # Send initial config
        await websocket.send_json({
            "type": "config",
            "attempt_id": str(attempt_id),
            "violation_count": attempt.violation_count
        })
        
        # Listen for messages from student
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "heartbeat":
                # Student is still active
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == "violation":
                # Client detected a violation
                violation_data = data.get("data", {})
                violation_type = violation_data.get("type", "unknown")
                severity = violation_data.get("severity", "medium")
                
                # Record violation
                violation = Violation(
                    exam_submission_id=attempt_id,
                    timestamp=datetime.utcnow(),
                    violation_type=violation_type,
                    severity=severity,
                    details=violation_data
                )
                db.add(violation)
                
                # Update attempt violation count
                attempt.violation_count += 1
                
                # Check threshold
                exam_result = await db.execute(
                    select(Exam).where(Exam.id == exam_id)
                )
                exam = exam_result.scalar_one_or_none()
                
                auto_submit = False
                if exam and exam.proctoring_config:
                    threshold = exam.proctoring_config.get("violation_threshold", 3)
                    if attempt.violation_count >= threshold:
                        auto_submit = True
                        attempt.status = SubmissionStatusEnum.AUTO_SUBMITTED
                        attempt.submitted_at = datetime.utcnow()
                        attempt.is_cheating = True
                
                await db.commit()
                
                # Notify faculty
                await manager.broadcast_to_faculty(exam_id, {
                    "type": "violation",
                    "student_id": str(attempt.student_id),
                    "violation_type": violation_type,
                    "severity": severity,
                    "count": attempt.violation_count,
                    "auto_submit": auto_submit,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Send response to student
                await websocket.send_json({
                    "type": "violation_recorded",
                    "count": attempt.violation_count,
                    "auto_submit": auto_submit
                })
            
            elif message_type == "face_status":
                # Face detection status update
                face_data = data.get("data", {})
                status = face_data.get("status", "unknown")  # visible, not_visible, multiple
                
                if status == "not_visible":
                    # Create violation for no face
                    violation = Violation(
                        exam_submission_id=attempt_id,
                        timestamp=datetime.utcnow(),
                        violation_type="face_not_visible",
                        severity="high",
                        details=face_data
                    )
                    db.add(violation)
                    attempt.violation_count += 1
                    await db.commit()
                    
                    # Notify faculty
                    await manager.broadcast_to_faculty(exam_id, {
                        "type": "violation",
                        "student_id": str(attempt.student_id),
                        "violation_type": "face_not_visible",
                        "severity": "high",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # Store face data (optional - could be heavy)
                # TODO: Store periodic snapshots
            
            elif message_type == "tab_switch":
                # Tab switch detected
                violation = Violation(
                    exam_submission_id=attempt_id,
                    timestamp=datetime.utcnow(),
                    violation_type="tab_switch",
                    severity="medium",
                    details=data.get("data", {})
                )
                db.add(violation)
                attempt.violation_count += 1
                await db.commit()
                
                # Notify faculty
                await manager.broadcast_to_faculty(exam_id, {
                    "type": "violation",
                    "student_id": str(attempt.student_id),
                    "violation_type": "tab_switch",
                    "severity": "medium",
                    "count": attempt.violation_count,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Warn student
                await websocket.send_json({
                    "type": "warning",
                    "message": f"Tab switch detected! ({attempt.violation_count} violations)"
                })
            
            elif message_type == "submit":
                # Student requests submit
                await manager.broadcast_to_faculty(exam_id, {
                    "type": "student_submit",
                    "student_id": str(attempt.student_id),
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect_student(attempt_id)
        
        # Record disconnect as potential violation
        # TODO: Could track idle time
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect_student(attempt_id)


# =============================================================================
# FACULTY MONITORING WEBSOCKET
# =============================================================================

@router.websocket("/ws/monitor/{exam_id}")
async def faculty_monitoring_websocket(
    websocket: WebSocket,
    exam_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for faculty monitoring.
    
    Faculty connects to this endpoint to monitor an ongoing exam.
    Receives:
    - Student start events
    - Student submit events
    - Violation alerts
    - Student status updates
    
    Can send:
    - Terminate student command
    - Pause student command
    """
    await manager.connect_faculty(websocket, exam_id)
    
    try:
        # Send current active students
        result = await db.execute(
            select(ExamSubmission).where(
                ExamSubmission.exam_id == exam_id,
                ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
            )
        )
        attempts = result.scalars().all()
        
        await websocket.send_json({
            "type": "init",
            "exam_id": str(exam_id),
            "active_students": [
                {
                    "attempt_id": str(a.id),
                    "student_id": str(a.student_id),
                    "started_at": a.started_at.isoformat(),
                    "violation_count": a.violation_count,
                    "ip_address": a.ip_address
                }
                for a in attempts
            ]
        })
        
        # Listen for commands from faculty
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "get_violations":
                # Get all violations for a student
                student_id = data.get("student_id")
                violations_result = await db.execute(
                    select(Violation).join(ExamSubmission).where(
                        ExamSubmission.exam_id == exam_id,
                        ExamSubmission.student_id == student_id
                    ).order_by(Violation.timestamp.desc())
                )
                violations = violations_result.scalars().all()
                
                await websocket.send_json({
                    "type": "violations",
                    "student_id": student_id,
                    "violations": [
                        {
                            "id": str(v.id),
                            "type": v.violation_type,
                            "severity": v.severity,
                            "timestamp": v.timestamp.isoformat(),
                            "acknowledged": v.acknowledged
                        }
                        for v in violations
                    ]
                })
            
            elif message_type == "terminate":
                # Terminate a student's attempt
                student_id = data.get("student_id")
                
                attempt_result = await db.execute(
                    select(ExamSubmission).where(
                        ExamSubmission.exam_id == exam_id,
                        ExamSubmission.student_id == student_id,
                        ExamSubmission.status == SubmissionStatusEnum.IN_PROGRESS
                    )
                )
                attempt = attempt_result.scalar_one_or_none()
                
                if attempt:
                    attempt.status = SubmissionStatusEnum.TERMINATED
                    attempt.submitted_at = datetime.utcnow()
                    attempt.is_cheating = True
                    attempt.proctoring_notes = "Terminated by faculty"
                    
                    # Create monitoring event
                    event = MonitoringEvent(
                        exam_id=exam_id,
                        student_id=student_id,
                        event_type=MonitoringEventTypeEnum.TERMINATE,
                        details={"terminated_by": "faculty"}
                    )
                    db.add(event)
                    await db.commit()
                    
                    # Notify student
                    await manager.send_to_student(attempt.id, {
                        "type": "terminated",
                        "message": "Your exam has been terminated by the invigilator"
                    })
                    
                    # Confirm to faculty
                    await websocket.send_json({
                        "type": "terminated",
                        "student_id": student_id
                    })
    
    except WebSocketDisconnect:
        manager.disconnect_faculty(websocket, exam_id)
    except Exception as e:
        print(f"Monitoring WebSocket error: {e}")
        manager.disconnect_faculty(websocket, exam_id)


# =============================================================================
# REDIS PUBSUB FOR HORIZONTAL SCALING
# =============================================================================

async def setup_redis_pubsub():
    """Setup Redis pubsub for scaling across multiple instances."""
    redis = await get_redis()
    
    # Subscribe to exam events
    pubsub = redis.pubsub()
    await pubsub.subscribe("exam_events")
    
    async for message in pubsub.listen():
        if message["type"] == "message":
            data = json.loads(message["data"])
            exam_id = UUID(data["exam_id"])
            
            # Broadcast to faculty
            await manager.broadcast_to_faculty(exam_id, data)


async def publish_exam_event(exam_id: UUID, event_data: dict):
    """Publish an exam event to Redis for other instances."""
    redis = await get_redis()
    event_data["exam_id"] = str(exam_id)
    await redis.publish("exam_events", json.dumps(event_data))
