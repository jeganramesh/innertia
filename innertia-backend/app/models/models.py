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
    Integer, Float, Enum as SQLEnum, UniqueConstraint, Index, JSON
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
    """User role enumeration - enforced at DB level.
    
    Roles:
    - admin: System-wide administrator (SaaS owner)
    - college_admin: College-level administrator
    - staff: Non-teaching administrative staff
    - faculty: Teaching staff
    - trainer: Placement/assessment trainer
    - student: Enrolled students
    """
    ADMIN = "admin"
    COLLEGE_ADMIN = "college_admin"
    STAFF = "staff"
    FACULTY = "faculty"
    TRAINER = "trainer"
    STUDENT = "student"


# =============================================================================
# CORE TABLES
# =============================================================================

class College(Base):
    """
    Colleges table - Multi-tenant support for SaaS architecture.
    
    Fields:
    - id: Primary key (UUID)
    - name: College name
    - code: Unique college code
    - domain: College domain (optional)
    - is_active: Whether college is active
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    
    Indexes:
    - code (unique)
    - is_active
    """
    
    __tablename__ = "colleges"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core fields
    name = Column(String(255), nullable=False)
    code = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255), nullable=True)  # College domain for email/logo
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # College settings (JSON)
    settings = Column(JSON, nullable=True, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # Users in this college
    users: List["User"] = relationship(
        "User",
        back_populates="college",
        foreign_keys="User.college_id"
    )
    
    # Classes in this college
    classes: List["Class"] = relationship(
        "Class",
        back_populates="college",
        foreign_keys="Class.college_id"
    )
    
    # College features
    features: List["CollegeFeature"] = relationship(
        "CollegeFeature",
        back_populates="college",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # Role feature permissions
    role_permissions: List["RoleFeaturePermission"] = relationship(
        "RoleFeaturePermission",
        back_populates="college",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # Departments in this college
    departments: List["Department"] = relationship(
        "Department",
        back_populates="college",
        foreign_keys="Department.college_id"
    )
    
    # Custom field definitions in this college
    custom_field_definitions: List["CustomFieldDefinition"] = relationship(
        "CustomFieldDefinition",
        back_populates="college",
        foreign_keys="CustomFieldDefinition.college_id"
    )
    
    def __repr__(self) -> str:
        return f"<College(id={self.id}, name={self.name}, code={self.code})>"


# =============================================================================
# CORE TABLES
# =============================================================================

class User(Base):
    """
    Users table - stores all platform users.
    
    Multi-tenant: admin has NULL college_id, all others MUST have college_id.
    """
    
    __tablename__ = "users"
    __allow_unmapped__ = True
    
    # Primary key - UUID for SQLite/PostgreSQL compatibility
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenant: college reference (NULL for admin)
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=True, index=True)
    
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
    
    # Student management fields
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    current_year = Column(Integer, nullable=True)  # 1,2,3,4 (or 0 if not applicable)
    section = Column(String(10), nullable=True)  # e.g., "A", "B"
    register_number = Column(String(50), nullable=True)  # Unique within college
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=True, index=True)
    custom_fields = Column(JSONB, nullable=True)  # Stores key-value pairs for custom fields
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # College relationship
    college: "College" = relationship(
        "College",
        back_populates="users",
        foreign_keys=[college_id]
    )
    
    # Department relationship
    department: "Department" = relationship(
        "Department",
        back_populates="students",
        foreign_keys=[department_id]
    )
    
    # Batch relationship
    batch: "Batch" = relationship("Batch", back_populates=None)
    
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
    
    Multi-tenant: All classes must belong to a college.
    
    Fields:
    - id: Primary key
    - college_id: Foreign key to colleges (multi-tenant)
    - name: Class name (max 120 chars)
    - department: Department name (max 120 chars)
    - academic_year: Academic year (e.g., "2024-2025")
    - faculty_id: Foreign key to users (faculty)
    - is_archived: Archive status
    - created_at: Creation timestamp
    - deleted_at: Soft delete timestamp
    
    Indexes:
    - college_id
    - faculty_id
    - academic_year
    """
    
    __tablename__ = "classes"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenant: college reference
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    
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
    
    # College relationship
    college: "College" = relationship(
        "College",
        back_populates="classes",
        foreign_keys=[college_id]
    )
    
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
    
    Multi-tenant: All sessions belong to a college through the class.
    
    Fields:
    - id: Primary key
    - class_id: Foreign key to classes
    - college_id: Foreign key to colleges (for quick filtering)
    - faculty_id: Foreign key to users (faculty)
    - start_time: Session start timestamp
    - end_time: Session end timestamp
    - is_active: Active status
    - created_at: Creation timestamp
    
    Indexes:
    - college_id
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
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
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
    
    Multi-tenant: college_id for cross-college isolation.
    
    Fields:
    - id: Primary key
    - college_id: Foreign key to colleges (NULL for platform-level actions)
    - action: Action performed (e.g., "CREATE", "UPDATE", "DELETE")
    - performed_by: Foreign key to users
    - target_type: Type of entity affected (e.g., "User", "Class")
    - target_id: ID of affected entity
    - metadata: JSON metadata about the action
    - created_at: Timestamp of action
    
    Indexes:
    - college_id
    - performed_by
    - created_at
    
    Note:
    - Never skip this table - required for production compliance
    """
    
    __tablename__ = "audit_logs"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenant: college reference (NULL for platform-level)
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=True, index=True)
    
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
# MULTI-TENANT FEATURE GATING TABLES
# =============================================================================

class CollegeFeature(Base):
    """
    College Features table - Platform-level feature toggles per college.
    
    This controls which features are available to a college.
    Platform admin enables/disables features at this level.
    
    Fields:
    - id: Primary key
    - college_id: Foreign key to colleges
    - feature_key: Unique feature identifier
    - is_enabled: Whether feature is enabled
    - created_at: Timestamp
    
    Example features:
    - attendance_tracking
    - ai_notes
    - placement_module
    - assessment_module
    - advanced_reports
    - live_session_lock
    
    Indexes:
    - college_id
    - feature_key (unique per college)
    """
    
    __tablename__ = "college_features"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Feature configuration
    feature_key = Column(String(100), nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # CONSTRAINTS
    # =========================================================================
    
    __table_args__ = (
        UniqueConstraint('college_id', 'feature_key', name='uq_college_feature'),
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    college: "College" = relationship(
        "College",
        back_populates="features",
        foreign_keys=[college_id]
    )
    
    def __repr__(self) -> str:
        return f"<CollegeFeature(college_id={self.college_id}, feature={self.feature_key}, enabled={self.is_enabled})>"


class RoleFeaturePermission(Base):
    """
    Role Feature Permissions table - College admin controls role access.
    
    This controls which roles can access which features within a college.
    College admin configures permissions at this level.
    
    Fields:
    - id: Primary key
    - college_id: Foreign key to colleges
    - role: Role that gets permission
    - feature_key: Feature identifier
    - is_enabled: Whether role can access feature
    
    Example:
    - college enables assessment_module at college level
    - but only trainer and student roles can access it
    
    Indexes:
    - college_id
    - role
    - (college_id, role, feature_key) unique
    """
    
    __tablename__ = "role_feature_permissions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Permission configuration
    role = Column(String(50), nullable=False, index=True)
    feature_key = Column(String(100), nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)
    
    # =========================================================================
    # CONSTRAINTS
    # =========================================================================
    
    __table_args__ = (
        UniqueConstraint('college_id', 'role', 'feature_key', name='uq_role_feature_permission'),
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    college: "College" = relationship(
        "College",
        back_populates="role_permissions",
        foreign_keys=[college_id]
    )
    
    def __repr__(self) -> str:
        return f"<RoleFeaturePermission(college_id={self.college_id}, role={self.role}, feature={self.feature_key})>"


# =============================================================================
# DATABASE INDEXES (Additional performance indexes)
# =============================================================================

# =============================================================================
# EXAMINATION & ASSESSMENT MODELS
# =============================================================================

class ExamTypeEnum(str, enum.Enum):
    """Exam type enumeration."""
    MCQ = "mcq"
    CODING = "coding"
    # Legacy values for backward compatibility
    QUIZ = "quiz"
    MIDTERM = "midterm"
    FINAL = "final"
    PRACTICAL = "practical"


class ExamStatusEnum(str, enum.Enum):
    """Exam status enumeration."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AssessmentTypeEnum(str, enum.Enum):
    """Assessment type enumeration."""
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    LAB = "lab"


class AssessmentStatusEnum(str, enum.Enum):
    """Assessment status enumeration."""
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class QuestionTypeEnum(str, enum.Enum):
    """Question type enumeration."""
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"


class SubmissionStatusEnum(str, enum.Enum):
    """Submission status enumeration."""
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


class ViolationTypeEnum(str, enum.Enum):
    """Violation type enumeration for proctoring."""
    TAB_SWITCH = "tab_switch"
    FULLSCREEN_EXIT = "fullscreen_exit"
    MULTIPLE_FACES = "multiple_faces"
    FACE_NOT_VISIBLE = "face_not_visible"
    PHONE_DETECTED = "phone_detected"
    SCREENSHOT = "screenshot"
    COPY_PASTE = "copy_paste"
    IDLE_TIMEOUT = "idle_timeout"


class ViolationSeverityEnum(str, enum.Enum):
    """Violation severity enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class MonitoringEventTypeEnum(str, enum.Enum):
    """Monitoring event type enumeration."""
    VIOLATION = "violation"
    START = "start"
    SUBMIT = "submit"
    PAUSE = "pause"
    RESUME = "resume"
    AUTO_SUBMIT = "auto_submit"
    TERMINATE = "terminate"


class ExamAttemptStatusEnum(str, enum.Enum):
    """Exam attempt status enumeration."""
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    AUTO_SUBMITTED = "auto_submitted"
    GRADED = "graded"
    TERMINATED = "terminated"


class Exam(Base):
    """
    Exams table - Stores exam information for colleges.
    
    Fields:
    - id: Primary key (UUID)
    - college_id: Foreign key to colleges
    - title: Exam title
    - description: Exam description
    - exam_type: Type of exam (quiz, midterm, final, practical)
    - status: Exam status (draft, scheduled, ongoing, completed, cancelled)
    - scheduled_at: Scheduled start date/time
    - duration_minutes: Exam duration
    - total_marks: Total marks
    - passing_marks: Passing marks
    - instructions: Exam instructions
    - course_id: Optional link to a class/course
    - exam_template_id: Optional reference to exam template
    - is_immediate: If true, starts on student click
    - max_attempts: Maximum number of attempts allowed
    - proctoring_config: JSON config for proctoring settings
    - created_by: User who created the exam
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    - deleted_at: Soft delete timestamp
    """
    
    __tablename__ = "exams"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True, index=True)
    exam_template_id = Column(UUID(as_uuid=True), ForeignKey("exam_templates.id"), nullable=True, index=True)
    
    # Core fields
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    exam_type = Column(SQLEnum(ExamTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ExamTypeEnum.MCQ)
    status = Column(SQLEnum(ExamStatusEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ExamStatusEnum.DRAFT, index=True)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    duration_minutes = Column(Integer, nullable=True)
    total_marks = Column(Integer, nullable=True)
    passing_marks = Column(Integer, nullable=True)
    instructions = Column(Text, nullable=True)
    is_immediate = Column(Boolean, default=False, nullable=False)
    max_attempts = Column(Integer, default=1, nullable=True)
    proctoring_config = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True, index=True)
    
    # =========================================================================
    # CONSTRAINTS
    # =========================================================================
    
    __table_args__ = (
        Index('ix_exam_college_status_scheduled', 'college_id', 'status', 'scheduled_at'),
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    college: "College" = relationship("College", back_populates=None)
    creator: "User" = relationship("User", back_populates=None)
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    submissions = relationship("ExamSubmission", back_populates="exam", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Exam(id={self.id}, title={self.title}, status={self.status})>"


class ExamQuestion(Base):
    """
    Exam questions table - Stores questions for exams.
    
    Fields:
    - id: Primary key (UUID)
    - exam_id: Foreign key to exams
    - question_text: Question content
    - question_type: Type (mcq, true_false, short_answer, essay)
    - options: JSON array for MCQ options
    - correct_answer: Correct answer
    - marks: Points for this question
    - negative_marks: Negative marks for wrong answer
    - section: Optional section name for section-wise timing
    - order_index: Question order
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    - deleted_at: Soft delete timestamp
    """
    
    __tablename__ = "exam_questions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True)
    
    # Core fields
    question_text = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionTypeEnum), nullable=False, default=QuestionTypeEnum.MCQ)
    options = Column(JSON, nullable=True)  # For MCQ: [{text, is_correct}, ...]
    correct_answer = Column(Text, nullable=True)
    marks = Column(Integer, nullable=False, default=1)
    negative_marks = Column(Integer, nullable=True, default=0)
    section = Column(String(100), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True, index=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    exam: "Exam" = relationship("Exam", back_populates="questions")
    
    def __repr__(self) -> str:
        return f"<ExamQuestion(id={self.id}, exam_id={self.exam_id})>"


class ExamSubmission(Base):
    """
    Exam submissions table - Stores student exam submissions (attempts).
    
    Fields:
    - id: Primary key (UUID)
    - exam_id: Foreign key to exams
    - student_id: Foreign key to users (students)
    - started_at: When student began the exam
    - submitted_at: When submitted
    - status: Submission status
    - total_obtained: Marks obtained after grading
    - graded_by: Faculty who graded
    - graded_at: When graded
    - answers: JSON object with answers
    - device_fingerprint: Unique identifier of device
    - ip_address: IP address of student
    - user_agent: Browser/device info
    - violation_count: Cumulative violation count
    - is_cheating: Flagged by AI or faculty
    - proctoring_notes: Notes from proctoring
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    """
    
    __tablename__ = "exam_submissions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Core fields
    started_at = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(SubmissionStatusEnum), nullable=False, default=SubmissionStatusEnum.IN_PROGRESS, index=True)
    total_obtained = Column(Integer, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    answers = Column(JSON, nullable=True)  # {question_id: answer}
    device_fingerprint = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    violation_count = Column(Integer, default=0, nullable=False)
    is_cheating = Column(Boolean, default=False, nullable=False)
    proctoring_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # CONSTRAINTS
    # =========================================================================
    
    __table_args__ = (
        UniqueConstraint('exam_id', 'student_id', name='uq_exam_submission'),
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    exam: "Exam" = relationship("Exam", back_populates="submissions")
    student: "User" = relationship("User", foreign_keys=[student_id], back_populates=None)
    grader: "User" = relationship("User", foreign_keys=[graded_by], back_populates=None)
    
    def __repr__(self) -> str:
        return f"<ExamSubmission(id={self.id}, exam_id={self.exam_id}, student_id={self.student_id})>"


class Assessment(Base):
    """
    Assessments table - Stores assessment information for colleges.
    
    Fields:
    - id: Primary key (UUID)
    - college_id: Foreign key to colleges
    - title: Assessment title
    - description: Assessment description
    - assessment_type: Type (quiz, assignment, lab)
    - status: Status (draft, published, closed)
    - due_at: Submission deadline
    - total_marks: Total marks
    - course_id: Optional link to a class/course
    - allow_retake: Whether retakes are allowed
    - max_attempts: Maximum number of attempts (null = unlimited)
    - shuffle_questions: Whether to shuffle questions
    - created_by: User who created
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    - deleted_at: Soft delete timestamp
    """
    
    __tablename__ = "assessments"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True, index=True)
    
    # Core fields
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assessment_type = Column(SQLEnum(AssessmentTypeEnum), nullable=False, default=AssessmentTypeEnum.QUIZ)
    status = Column(SQLEnum(AssessmentStatusEnum), nullable=False, default=AssessmentStatusEnum.DRAFT, index=True)
    due_at = Column(DateTime, nullable=True, index=True)
    total_marks = Column(Integer, nullable=True)
    allow_retake = Column(Boolean, default=False, nullable=False)
    max_attempts = Column(Integer, nullable=True)
    shuffle_questions = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True, index=True)
    
    # =========================================================================
    # CONSTRAINTS
    # =========================================================================
    
    __table_args__ = (
        Index('ix_assessment_college_type_due', 'college_id', 'assessment_type', 'due_at'),
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    college: "College" = relationship("College", back_populates=None)
    creator: "User" = relationship("User", back_populates=None)
    questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan")
    submissions = relationship("AssessmentSubmission", back_populates="assessment", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Assessment(id={self.id}, title={self.title}, status={self.status})>"


class AssessmentQuestion(Base):
    """
    Assessment questions table - Stores questions for assessments.
    
    Fields:
    - id: Primary key (UUID)
    - assessment_id: Foreign key to assessments
    - question_text: Question content
    - question_type: Type (mcq, true_false, short_answer, essay)
    - options: JSON array for MCQ options
    - correct_answer: Correct answer
    - marks: Points for this question
    - order_index: Question order
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    - deleted_at: Soft delete timestamp
    """
    
    __tablename__ = "assessment_questions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True)
    
    # Core fields
    question_text = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionTypeEnum), nullable=False, default=QuestionTypeEnum.MCQ)
    options = Column(JSON, nullable=True)
    correct_answer = Column(Text, nullable=True)
    marks = Column(Integer, nullable=False, default=1)
    order_index = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True, index=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    assessment: "Assessment" = relationship("Assessment", back_populates="questions")
    
    def __repr__(self) -> str:
        return f"<AssessmentQuestion(id={self.id}, assessment_id={self.assessment_id})>"


class AssessmentSubmission(Base):
    """
    Assessment submissions table - Stores student assessment submissions.
    
    Fields:
    - id: Primary key (UUID)
    - assessment_id: Foreign key to assessments
    - student_id: Foreign key to users (students)
    - started_at: When student began
    - submitted_at: When submitted
    - status: Submission status
    - total_obtained: Marks obtained after grading
    - graded_by: Faculty who graded
    - graded_at: When graded
    - answers: JSON object with answers
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    """
    
    __tablename__ = "assessment_submissions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Core fields
    started_at = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(SubmissionStatusEnum), nullable=False, default=SubmissionStatusEnum.IN_PROGRESS, index=True)
    total_obtained = Column(Integer, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    answers = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # CONSTRAINTS
    # =========================================================================
    
    __table_args__ = (
        UniqueConstraint('assessment_id', 'student_id', name='uq_assessment_submission'),
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    assessment: "Assessment" = relationship("Assessment", back_populates="submissions")
    student: "User" = relationship("User", foreign_keys=[student_id], back_populates=None)
    grader: "User" = relationship("User", foreign_keys=[graded_by], back_populates=None)
    
    def __repr__(self) -> str:
        return f"<AssessmentSubmission(id={self.id}, assessment_id={self.assessment_id}, student_id={self.student_id})>"


# =============================================================================
# STUDENT MANAGEMENT MODELS
# =============================================================================

class CustomFieldTypeEnum(str, enum.Enum):
    """Custom field type enumeration for student custom fields."""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    BOOLEAN = "boolean"
    SELECT = "select"


class Department(Base):
    """
    Departments table - stores department information for colleges.
    
    Multi-tenant: Each department belongs to a specific college.
    """
    
    __tablename__ = "departments"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenant: college reference
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Core fields
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # College relationship
    college: "College" = relationship(
        "College",
        back_populates="departments",
        foreign_keys=[college_id]
    )
    
    # Students in this department
    students: List["User"] = relationship(
        "User",
        back_populates="department",
        foreign_keys="User.department_id"
    )
    
    def __repr__(self) -> str:
        return f"<Department(id={self.id}, name={self.name}, code={self.code})>"


class CustomFieldDefinition(Base):
    """
    Custom Field Definitions table - stores custom field definitions for students.
    
    Multi-tenant: Each custom field belongs to a specific college.
    """
    
    __tablename__ = "custom_field_definitions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenant: college reference
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Core fields
    name = Column(String(100), nullable=False)
    field_key = Column(String(100), nullable=False)
    field_type = Column(String(20), nullable=False)  # CustomFieldTypeEnum stored as string
    options = Column(JSONB, nullable=True)  # For select type: array of { value, label }
    is_required = Column(Boolean, default=False, nullable=False)
    is_filterable = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # College relationship
    college: "College" = relationship(
        "College",
        back_populates="custom_field_definitions",
        foreign_keys=[college_id]
    )
    
    def __repr__(self) -> str:
        return f"<CustomFieldDefinition(id={self.id}, name={self.name}, field_key={self.field_key})>"


# =============================================================================
# BATCHES
# =============================================================================

class Batch(Base):
    """
    Batches table - stores batch/academic year information for colleges.
    
    Multi-tenant: Each batch belongs to a specific college.
    """
    
    __tablename__ = "batches"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenant: college reference
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Core fields
    name = Column(String(100), nullable=False)
    academic_year = Column(String(20), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # College relationship
    college: "College" = relationship("College", back_populates=None)
    
    # Students in this batch
    students = relationship("User", back_populates=None)
    
    def __repr__(self) -> str:
        return f"<Batch(id={self.id}, name={self.name}, academic_year={self.academic_year})>"


# =============================================================================
# EXAM TEMPLATES
# =============================================================================

class ExamTemplate(Base):
    """
    Exam templates table - stores reusable exam configurations.
    
    Multi-tenant: Each template belongs to a specific college.
    """
    
    __tablename__ = "exam_templates"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenant: college reference
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Core fields
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    total_marks = Column(Integer, nullable=True)
    passing_marks = Column(Integer, nullable=True)
    shuffle_questions = Column(Boolean, default=False, nullable=False)
    shuffle_options = Column(Boolean, default=False, nullable=False)
    allow_navigation = Column(Boolean, default=True, nullable=False)
    allow_review = Column(Boolean, default=False, nullable=False)
    show_result_immediately = Column(Boolean, default=False, nullable=False)
    proctoring_config = Column(JSONB, nullable=True)
    
    # Creator
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    college: "College" = relationship("College", back_populates=None)
    creator: "User" = relationship("User", back_populates=None)
    exams = relationship("Exam", back_populates=None)
    
    def __repr__(self) -> str:
        return f"<ExamTemplate(id={self.id}, name={self.name})>"


# =============================================================================
# VIOLATIONS (PROCTORING)
# =============================================================================

class Violation(Base):
    """
    Violations table - stores proctoring violations during exams.
    """
    
    __tablename__ = "violations"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to exam submission
    exam_submission_id = Column(UUID(as_uuid=True), ForeignKey("exam_submissions.id"), nullable=False, index=True)
    
    # Core fields
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    violation_type = Column(SQLEnum(ViolationTypeEnum), nullable=False, index=True)
    severity = Column(SQLEnum(ViolationSeverityEnum), nullable=False, index=True)
    details = Column(JSONB, nullable=True)
    acknowledged = Column(Boolean, default=False, nullable=False, index=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    exam_submission = relationship("ExamSubmission", back_populates=None)
    
    def __repr__(self) -> str:
        return f"<Violation(id={self.id}, type={self.violation_type}, severity={self.severity})>"


# =============================================================================
# PROCTORING SNAPSHOTS
# =============================================================================

class ProctoringSnapshot(Base):
    """
    Proctoring snapshots table - stores periodic snapshots during exams.
    """
    
    __tablename__ = "proctoring_snapshots"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to exam submission
    exam_submission_id = Column(UUID(as_uuid=True), ForeignKey("exam_submissions.id"), nullable=False, index=True)
    
    # Core fields
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    image_url = Column(Text, nullable=True)
    face_data = Column(JSONB, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    exam_submission = relationship("ExamSubmission", back_populates=None)
    
    def __repr__(self) -> str:
        return f"<ProctoringSnapshot(id={self.id}, exam_submission_id={self.exam_submission_id})>"


# =============================================================================
# LIVE MONITORING SESSIONS
# =============================================================================

class LiveMonitoringSession(Base):
    """
    Live monitoring sessions table - tracks faculty monitoring of exams.
    """
    
    __tablename__ = "live_monitoring_sessions"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Core fields
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    exam: "Exam" = relationship("Exam", back_populates=None)
    faculty: "User" = relationship("User", back_populates=None)
    
    def __repr__(self) -> str:
        return f"<LiveMonitoringSession(id={self.id}, exam_id={self.exam_id}, faculty_id={self.faculty_id})>"


# =============================================================================
# MONITORING EVENTS
# =============================================================================

class MonitoringEvent(Base):
    """
    Monitoring events table - stores real-time events during exams.
    """
    
    __tablename__ = "monitoring_events"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Core fields
    event_type = Column(SQLEnum(MonitoringEventTypeEnum), nullable=False, index=True)
    details = Column(JSONB, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    exam: "Exam" = relationship("Exam", back_populates=None)
    student: "User" = relationship("User", back_populates=None)
    
    def __repr__(self) -> str:
        return f"<MonitoringEvent(id={self.id}, type={self.event_type}, exam_id={self.exam_id})>"


# =============================================================================
# STUDENT PROGRESS SNAPSHOTS
# =============================================================================

class StudentProgressSnapshot(Base):
    """
    Student progress snapshots table - pre-aggregated daily/weekly performance data.
    """
    
    __tablename__ = "student_progress_snapshots"
    __allow_unmapped__ = True
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True, index=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=True, index=True)
    
    # Core fields
    snapshot_date = Column(DateTime, nullable=False, index=True)
    exams_taken = Column(Integer, default=0, nullable=False)
    avg_score = Column(Float, nullable=True)
    total_violations = Column(Integer, default=0, nullable=False)
    year = Column(Integer, nullable=True)
    data = Column(JSONB, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    student: "User" = relationship("User", back_populates=None)
    department: "Department" = relationship("Department", back_populates=None)
    batch: "Batch" = relationship("Batch", back_populates=None)
    
    def __repr__(self) -> str:
        return f"<StudentProgressSnapshot(id={self.id}, student_id={self.student_id}, date={self.snapshot_date})>"


__all__ = [
    "Base",
    "RoleEnum",
    "College",
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
    "CollegeFeature",
    "RoleFeaturePermission",
    # Examination & Assessment models
    "ExamTypeEnum",
    "ExamStatusEnum",
    "AssessmentTypeEnum",
    "AssessmentStatusEnum",
    "QuestionTypeEnum",
    "SubmissionStatusEnum",
    "ExamAttemptStatusEnum",
    "ViolationTypeEnum",
    "ViolationSeverityEnum",
    "MonitoringEventTypeEnum",
    "Exam",
    "ExamQuestion",
    "ExamSubmission",
    "Assessment",
    "AssessmentQuestion",
    "AssessmentSubmission",
    "ExamTemplate",
    "Violation",
    "ProctoringSnapshot",
    "LiveMonitoringSession",
    "MonitoringEvent",
    "StudentProgressSnapshot",
    # Student Management models
    "CustomFieldTypeEnum",
    "Department",
    "CustomFieldDefinition",
    "Batch",
]
