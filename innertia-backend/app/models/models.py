"""
SQLAlchemy models for the Innertia system.
Includes users, classes, sessions, enrollments, slide_state, and notes.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class RoleEnum(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"


class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="student")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    taught_classes = relationship("Class", back_populates="faculty", foreign_keys="Class.faculty_id")
    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class RefreshToken(Base):
    """Refresh token model for JWT authentication."""
    
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # User relationship
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.revoked})>"


class Class(Base):
    """Class/Course model."""
    
    __tablename__ = "classes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    faculty = relationship("User", back_populates="taught_classes", foreign_keys=[faculty_id])
    sessions = relationship("Session", back_populates="class_obj", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="class_obj", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Class(id={self.id}, name={self.name}, faculty_id={self.faculty_id})>"


class Session(Base):
    """Class session model."""
    
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    class_obj = relationship("Class", back_populates="sessions")
    slide_states = relationship("SlideState", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Session(id={self.id}, class_id={self.class_id}, is_active={self.is_active})>"


class Enrollment(Base):
    """Student enrollment in classes."""
    
    __tablename__ = "enrollments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="enrollments")
    class_obj = relationship("Class", back_populates="enrollments")
    
    def __repr__(self) -> str:
        return f"<Enrollment(id={self.id}, user_id={self.user_id}, class_id={self.class_id})>"


class SlideState(Base):
    """Current slide state for a session."""
    
    __tablename__ = "slide_state"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    current_slide = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="slide_states")
    
    def __repr__(self) -> str:
        return f"<SlideState(id={self.id}, session_id={self.session_id}, slide={self.current_slide})>"


class Note(Base):
    """Student notes for a class."""
    
    __tablename__ = "notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    slide_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notes")
    
    def __repr__(self) -> str:
        return f"<Note(id={self.id}, user_id={self.user_id}, class_id={self.class_id})>"


class AINote(Base):
    """AI-generated immersive notes for a class."""
    
    __tablename__ = "ai_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False, index=True)
    lesson_title = Column(String(500), nullable=False)
    raw_text = Column(Text, nullable=False)
    structured_content = Column(Text, nullable=False)  # JSON string
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    class_obj = relationship("Class")
    creator = relationship("User")
    
    def __repr__(self) -> str:
        return f"<AINote(id={self.id}, class_id={self.class_id}, lesson_title={self.lesson_title})>"
