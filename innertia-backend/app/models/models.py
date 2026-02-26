"""
Production-Grade SQLAlchemy Models for Innertia Academic OS.

Design Principles:
- No hard deletes (soft delete with deleted_at)
- Full audit trail
- Role-based access enforced at DB model level
- JSON fields for AI structured output
- Indexed critical columns
- Compatible with SQLite and PostgreSQL
- Backward compatible with existing UUID-based schema
"""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, ForeignKey, 
    Integer, Enum as SQLEnum, UniqueConstraint, Index, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base
import enum

# Use Base from models.base to avoid circular imports
from app.models.base import Base


# =============================================================================
# ENUMERATIONS
# =============================================================================

class RoleEnum(str, enum.Enum):
    """User role enumeration - enforced at DB level."""
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"


# =============================================================================
# CORE TABLES
# =============================================================================

class User(Base):
    """
    Users table - stores all platform users.
    """
    
    __tablename__ = "users"
    __allow_unmapped__ = True
    __allow_unmapped__ = True
    
    # Primary key - UUID for SQLite/PostgreSQL compatibility
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core fields
    full_name = Column(String(120), nullable=True)  # Backward compat with 'name'
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student", index=True)
    
    # Legacy field for backward compatibility
    name = Column(String(255), nullable=True)  # Kept for backward compat
    
    # Status fields
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # Classes taught by faculty
    taught_classes: List["Class"] = relationship(
        "Class", 
        back_populates="faculty", 
        foreign_keys="Class.faculty_id"
    )
    
    # Student enrollments
    enrollments: List["Enrollment"] = relationship(
        "Enrollment", 
        back_populates="student",
        foreign_keys="Enrollment.student_id"
    )
    
    # AI Notes created by faculty
    ai_notes: List["AINote"] = relationship(
        "AINote",
        back_populates="faculty",
        foreign_keys="AINote.faculty_id"
    )
    
    # Sessions started by faculty
    faculty_sessions: List["Session"] = relationship(
        "Session",
        back_populates="faculty",
        foreign_keys="Session.faculty_id"
    )
    
    # Slide activity records
    slide_activities: List["SlideActivity"] = relationship(
        "SlideActivity",
        back_populates="student",
        foreign_keys="SlideActivity.student_id"
    )
    
    # Audit logs performed by user
    audit_logs: List["AuditLog"] = relationship(
        "AuditLog",
        back_populates="performed_by_user",
        foreign_keys="AuditLog.performed_by"
    )
    
    # Refresh tokens for authentication
    refresh_tokens: List["RefreshToken"] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role.value})>"


class RefreshToken(Base):
    """
    Refresh token model for JWT authentication.
    """
    
    __tablename__ = "refresh_tokens"
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.revoked})>"


class Class(Base):
    """
    Classes/Courses table.
    
    Fields:
    - id: Primary key
    - name: Class name (max 120 chars)
    - department: Department name (max 120 chars)
    - academic_year: Academic year (e.g., "2024-2025")
    - faculty_id: Foreign key to users (faculty)
    - is_archived: Archive status
    - created_at: Creation timestamp
    - deleted_at: Soft delete timestamp
    
    Indexes:
    - faculty_id
    - academic_year
    """
    
    __tablename__ = "classes"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core fields
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)  # Legacy field
    department = Column(String(120), nullable=True)
    academic_year = Column(String(20), nullable=True, index=True)
    
    # Foreign key to faculty
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Status fields
    is_active = Column(Boolean, default=True, nullable=False)  # Legacy field
    is_archived = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # Faculty who teaches this class
    faculty: "User" = relationship(
        "User", 
        back_populates="taught_classes", 
        foreign_keys=[faculty_id]
    )
    
    # Sessions for this class
    sessions: List["Session"] = relationship(
        "Session",
        back_populates="class_obj",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # Enrollments in this class
    enrollments: List["Enrollment"] = relationship(
        "Enrollment",
        back_populates="class_obj",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # AI Notes for this class
    ai_notes: List["AINote"] = relationship(
        "AINote",
        back_populates="class_obj",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    def __repr__(self) -> str:
        return f"<Class(id={self.id}, name={self.name}, faculty_id={self.faculty_id})>"


class Enrollment(Base):
    """
    Enrollments table - Many-to-many relationship between students and classes.
    
    Fields:
    - id: Primary key
    - student_id: Foreign key to users
    - class_id: Foreign key to classes
    - created_at: Enrollment timestamp
    
    Constraints:
    - Unique (student_id, class_id)
    
    Indexes:
    - class_id
    - student_id
    """
    
    __tablename__ = "enrollments"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys (using user_id for backward compat)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    
    # Legacy field name for backward compatibility
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Legacy
    
    # Timestamp
    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # CONSTRAINTS
    # =========================================================================
    
    __table_args__ = (
        UniqueConstraint('student_id', 'class_id', name='uq_enrollment_student_class'),
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    student: "User" = relationship(
        "User",
        back_populates="enrollments",
        foreign_keys=[student_id]
    )
    
    class_obj: "Class" = relationship(
        "Class",
        back_populates="enrollments",
        foreign_keys=[class_id]
    )
    
    def __repr__(self) -> str:
        return f"<Enrollment(id={self.id}, student_id={self.student_id}, class_id={self.class_id})>"


class Session(Base):
    """
    Sessions table - Tracks live faculty sessions.
    
    Fields:
    - id: Primary key
    - class_id: Foreign key to classes
    - faculty_id: Foreign key to users (faculty)
    - start_time: Session start timestamp
    - end_time: Session end timestamp
    - is_active: Active status
    - created_at: Creation timestamp
    
    Indexes:
    - class_id
    - faculty_id
    - is_active
    """
    
    __tablename__ = "sessions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Session timing (legacy field names kept for backward compat)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)  # Legacy
    ended_at = Column(DateTime, nullable=True)    # Legacy
    
    # Status
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    class_obj: "Class" = relationship(
        "Class",
        back_populates="sessions",
        foreign_keys=[class_id]
    )
    
    faculty: "User" = relationship(
        "User",
        back_populates="faculty_sessions",
        foreign_keys=[faculty_id]
    )
    
    # Current slide state for this session
    slide_state: Optional["SlideState"] = relationship(
        "SlideState",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    # Student slide activities
    slide_activities: List["SlideActivity"] = relationship(
        "SlideActivity",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    def __repr__(self) -> str:
        return f"<Session(id={self.id}, class_id={self.class_id}, is_active={self.is_active})>"


class SlideState(Base):
    """
    Slide States table - Tracks current slide in session.
    
    Fields:
    - id: Primary key
    - session_id: Foreign key to sessions
    - current_slide_number: Current slide number
    - slide_lock_enabled: Whether slide is locked
    - updated_at: Last update timestamp
    
    Indexes:
    - session_id
    """
    
    __tablename__ = "slide_states"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key (legacy table name for backward compat)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, unique=True, index=True)
    
    # Slide tracking (legacy field names kept for backward compat)
    current_slide_number = Column(Integer, default=0, nullable=False)
    current_slide = Column(Integer, default=0, nullable=False)  # Legacy
    slide_lock_enabled = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)  # Legacy
    
    # Timestamp
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    session: "Session" = relationship(
        "Session",
        back_populates="slide_state",
        foreign_keys=[session_id]
    )
    
    def __repr__(self) -> str:
        return f"<SlideState(id={self.id}, session_id={self.session_id}, slide={self.current_slide_number})>"


class SlideActivity(Base):
    """
    Slide Activity table - Tracks per student behavior during sessions.
    Powers the Cognitive Heatmap feature.
    
    Fields:
    - id: Primary key
    - session_id: Foreign key to sessions
    - student_id: Foreign key to users
    - slide_number: Slide number
    - time_spent_seconds: Time spent on slide
    - last_seen_at: Last time student viewed slide
    - is_synced: Whether activity is synced
    
    Indexes:
    - session_id
    - student_id
    - slide_number
    """
    
    __tablename__ = "slide_activity"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Activity tracking
    slide_number = Column(Integer, nullable=False, index=True)
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    last_seen_at = Column(DateTime, nullable=True)
    is_synced = Column(Boolean, default=False, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    session: "Session" = relationship(
        "Session",
        back_populates="slide_activities",
        foreign_keys=[session_id]
    )
    
    student: "User" = relationship(
        "User",
        back_populates="slide_activities",
        foreign_keys=[student_id]
    )
    
    def __repr__(self) -> str:
        return f"<SlideActivity(id={self.id}, student_id={self.student_id}, slide={self.slide_number})>"


class AINote(Base):
    """
    AI Notes table - Stores generated immersive notes.
    
    Fields:
    - id: Primary key
    - class_id: Foreign key to classes
    - faculty_id: Foreign key to users (creator)
    - lesson_title: Title of the lesson
    - raw_text: Raw AI-generated text
    - structured_content: JSON structured content (AI output)
    - created_at: Creation timestamp
    - deleted_at: Soft delete timestamp
    
    Indexes:
    - class_id
    - faculty_id
    
    Note:
    - Uses JSON field (TEXT in SQLite, JSONB in PostgreSQL)
    """
    
    __tablename__ = "ai_notes"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Legacy foreign key name for backward compat
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Legacy
    
    # Content fields
    lesson_title = Column(String(500), nullable=False)
    raw_text = Column(Text, nullable=False)
    structured_content = Column(Text, nullable=True)  # JSON string for SQLite/PostgreSQL compat
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    class_obj: "Class" = relationship(
        "Class",
        back_populates="ai_notes",
        foreign_keys=[class_id]
    )
    
    faculty: "User" = relationship(
        "User",
        back_populates="ai_notes",
        foreign_keys=[faculty_id]
    )
    
    def __repr__(self) -> str:
        return f"<AINote(id={self.id}, class_id={self.class_id}, lesson_title={self.lesson_title})>"


class AuditLog(Base):
    """
    Audit Logs table - Mandatory for production compliance.
    Tracks all actions performed in the system.
    
    Fields:
    - id: Primary key
    - action: Action performed (e.g., "CREATE", "UPDATE", "DELETE")
    - performed_by: Foreign key to users
    - target_type: Type of entity affected (e.g., "User", "Class")
    - target_id: ID of affected entity
    - metadata: JSON metadata about the action
    - created_at: Timestamp of action
    
    Indexes:
    - performed_by
    - created_at
    
    Note:
    - Never skip this table - required for production compliance
    """
    
    __tablename__ = "audit_logs"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Action details
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    target_type = Column(String(50), nullable=True)  # User, Class, Session, etc.
    target_id = Column(String(100), nullable=True)  # UUID as string for flexibility
    
    # JSON metadata - stores previous values and action details
    metadata_json = Column(Text, nullable=True)  # JSON string
    
    # IP Address for audit
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    performed_by_user: "User" = relationship(
        "User",
        back_populates="audit_logs",
        foreign_keys=[performed_by]
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action}, performed_by={self.performed_by})>"


class SystemSetting(Base):
    """
    System Settings table - Feature toggles and configuration.
    
    Fields:
    - id: Primary key
    - key: Unique setting key (e.g., "enable_ai_notes")
    - value: Setting value
    - updated_at: Last update timestamp
    
    Examples:
    - enable_ai_notes: boolean
    - enable_slide_lock: boolean
    - enable_heatmap: boolean
    
    Note:
    - Use unique constraint on key
    """
    
    __tablename__ = "system_settings"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Settings
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    
    # Timestamp
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self) -> str:
        return f"<SystemSetting(key={self.key}, value={self.value})>"


# =============================================================================
# LEGACY MODELS (for backward compatibility)
# =============================================================================

class Note(Base):
    """
    Legacy Notes table - Student personal notes for a class.
    Kept for backward compatibility.
    """
    
    __tablename__ = "notes"
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    slide_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<Note(id={self.id}, user_id={self.user_id}, class_id={self.class_id})>"


# =============================================================================
# DATABASE INDEXES (Additional performance indexes)
# =============================================================================

__all__ = [
    "Base",
    "RoleEnum",
    "User",
    "RefreshToken",
    "Class",
    "Enrollment",
    "Session",
    "SlideState",
    "SlideActivity",
    "AINote",
    "AuditLog",
    "SystemSetting",
    "Note",
]
