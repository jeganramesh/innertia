"""Add production-grade tables: audit_logs, system_settings, slide_activity

Revision ID: 003
Revises: 002
Create Date: 2026-02-20

This migration adds:
1. audit_logs - Mandatory production audit trail
2. system_settings - Feature toggles
3. slide_activity - Per-student behavior tracking for heatmap

Also adds new columns to existing tables for soft delete support.
"""

from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# =============================================================================
# Helper utilities for idempotent migrations
# =============================================================================

def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists in a table (PostgreSQL compatible)."""
    bind = op.get_bind()
    result = bind.execute(
        sa.text("SELECT column_name FROM information_schema.columns WHERE table_name = :table_name AND column_name = :column_name"),
        {"table_name": table_name, "column_name": column_name}
    ).fetchone()
    return result is not None


def _table_exists(table_name: str) -> bool:
    """Check if a table already exists (PostgreSQL compatible)."""
    bind = op.get_bind()
    result = bind.execute(
        sa.text("SELECT table_name FROM information_schema.tables WHERE table_name = :table_name AND table_schema = 'public'"),
        {"table_name": table_name}
    ).fetchone()
    return result is not None


def _index_exists(index_name: str) -> bool:
    """Check if an index already exists (PostgreSQL compatible)."""
    bind = op.get_bind()
    result = bind.execute(
        sa.text("SELECT indexname FROM pg_indexes WHERE indexname = :index_name"),
        {"index_name": index_name}
    ).fetchone()
    return result is not None


def _add_column_if_not_exists(table_name: str, column: sa.Column) -> None:
    """Add a column only if it doesn't already exist."""
    if not _column_exists(table_name, column.name):
        op.add_column(table_name, column)


def _create_index_if_not_exists(index_name: str, table_name: str, columns: list, **kwargs) -> None:
    """Create an index only if it doesn't already exist."""
    if not _index_exists(index_name):
        op.create_index(index_name, table_name, columns, **kwargs)


def upgrade() -> None:
    # =========================================================================
    # 1. Add columns to existing tables for soft delete support
    # =========================================================================
    
    # Add deleted_at and full_name to users table
    _add_column_if_not_exists('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    _add_column_if_not_exists('users', sa.Column('full_name', sa.String(length=120), nullable=True))
    
    # Add is_archived, department, academic_year, deleted_at to classes table
    _add_column_if_not_exists('classes', sa.Column('department', sa.String(length=120), nullable=True))
    _add_column_if_not_exists('classes', sa.Column('academic_year', sa.String(length=20), nullable=True))
    _add_column_if_not_exists('classes', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'))
    _add_column_if_not_exists('classes', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    
    # Add student_id, created_at to enrollments table
    _add_column_if_not_exists('enrollments', sa.Column('student_id', sa.UUID(), nullable=True))
    _add_column_if_not_exists('enrollments', sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()))
    
    # Add faculty_id, start_time, end_time to sessions table
    _add_column_if_not_exists('sessions', sa.Column('faculty_id', sa.UUID(), nullable=True))
    _add_column_if_not_exists('sessions', sa.Column('start_time', sa.DateTime(), nullable=True))
    _add_column_if_not_exists('sessions', sa.Column('end_time', sa.DateTime(), nullable=True))
    
    # Add slide_lock_enabled, current_slide_number to slide_state table
    _add_column_if_not_exists('slide_state', sa.Column('slide_lock_enabled', sa.Boolean(), nullable=False, server_default='false'))
    _add_column_if_not_exists('slide_state', sa.Column('current_slide_number', sa.Integer(), nullable=False, server_default='0'))
    
    # Add deleted_at, faculty_id to ai_notes table
    _add_column_if_not_exists('ai_notes', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    _add_column_if_not_exists('ai_notes', sa.Column('faculty_id', sa.UUID(), nullable=True))
    
    # Create indexes for new columns (idempotent)
    _create_index_if_not_exists('ix_classes_academic_year', 'classes', ['academic_year'])
    _create_index_if_not_exists('ix_classes_is_archived', 'classes', ['is_archived'])
    _create_index_if_not_exists('ix_sessions_faculty_id', 'sessions', ['faculty_id'])
    _create_index_if_not_exists('ix_sessions_is_active', 'sessions', ['is_active'])
    _create_index_if_not_exists('ix_users_is_active', 'users', ['is_active'])
    _create_index_if_not_exists('ix_users_role', 'users', ['role'])
    
    # =========================================================================
    # 2. Create slide_activity table (for cognitive heatmap)
    # =========================================================================
    
    if not _table_exists('slide_activity'):
        op.create_table(
            'slide_activity',
            sa.Column('id', sa.UUID(), nullable=False, default=uuid.uuid4),
            sa.Column('session_id', sa.UUID(), nullable=False),
            sa.Column('student_id', sa.UUID(), nullable=False),
            sa.Column('slide_number', sa.Integer(), nullable=False),
            sa.Column('time_spent_seconds', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_seen_at', sa.DateTime(), nullable=True),
            sa.Column('is_synced', sa.Boolean(), nullable=False, server_default='false'),
            sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
    _create_index_if_not_exists(op.f('ix_slide_activity_session_id'), 'slide_activity', ['session_id'])
    _create_index_if_not_exists(op.f('ix_slide_activity_student_id'), 'slide_activity', ['student_id'])
    _create_index_if_not_exists(op.f('ix_slide_activity_slide_number'), 'slide_activity', ['slide_number'])
    
    # =========================================================================
    # 3. Create audit_logs table (mandatory for production)
    # =========================================================================
    
    if not _table_exists('audit_logs'):
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.UUID(), nullable=False, default=uuid.uuid4),
            sa.Column('action', sa.String(length=50), nullable=False),
            sa.Column('performed_by', sa.UUID(), nullable=False),
            sa.Column('target_type', sa.String(length=50), nullable=True),
            sa.Column('target_id', sa.String(length=100), nullable=True),
            sa.Column('metadata_json', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
    _create_index_if_not_exists(op.f('ix_audit_logs_performed_by'), 'audit_logs', ['performed_by'])
    _create_index_if_not_exists(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'])
    
    # =========================================================================
    # 4. Create system_settings table (feature toggles)
    # =========================================================================
    
    if not _table_exists('system_settings'):
        op.create_table(
            'system_settings',
            sa.Column('id', sa.UUID(), nullable=False, default=uuid.uuid4),
            sa.Column('key', sa.String(length=100), nullable=False),
            sa.Column('value', sa.Text(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('key')
        )
    _create_index_if_not_exists(op.f('ix_system_settings_key'), 'system_settings', ['key'], unique=True)
    
    # =========================================================================
    # 5. Seed default system settings (only if table is empty)
    # =========================================================================
    
    bind = op.get_bind()
    count = bind.execute(sa.text("SELECT COUNT(*) FROM system_settings")).scalar()
    if count == 0:
        op.execute("""
            INSERT INTO system_settings (id, key, value, updated_at) VALUES
            ('{id1}', 'enable_ai_notes', 'true', CURRENT_TIMESTAMP),
            ('{id2}', 'enable_slide_lock', 'true', CURRENT_TIMESTAMP),
            ('{id3}', 'enable_heatmap', 'true', CURRENT_TIMESTAMP),
            ('{id4}', 'enable_audit_logs', 'true', CURRENT_TIMESTAMP)
        """.format(
            id1=str(uuid.uuid4()),
            id2=str(uuid.uuid4()),
            id3=str(uuid.uuid4()),
            id4=str(uuid.uuid4())
        ))


def downgrade() -> None:
    """Remove production-grade tables and columns."""
    
    # Drop system_settings table
    if _index_exists(op.f('ix_system_settings_key')):
        op.drop_index(op.f('ix_system_settings_key'), table_name='system_settings')
    if _table_exists('system_settings'):
        op.drop_table('system_settings')
    
    # Drop audit_logs table
    if _index_exists(op.f('ix_audit_logs_created_at')):
        op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    if _index_exists(op.f('ix_audit_logs_performed_by')):
        op.drop_index(op.f('ix_audit_logs_performed_by'), table_name='audit_logs')
    if _table_exists('audit_logs'):
        op.drop_table('audit_logs')
    
    # Drop slide_activity table
    if _index_exists(op.f('ix_slide_activity_slide_number')):
        op.drop_index(op.f('ix_slide_activity_slide_number'), table_name='slide_activity')
    if _index_exists(op.f('ix_slide_activity_student_id')):
        op.drop_index(op.f('ix_slide_activity_student_id'), table_name='slide_activity')
    if _index_exists(op.f('ix_slide_activity_session_id')):
        op.drop_index(op.f('ix_slide_activity_session_id'), table_name='slide_activity')
    if _table_exists('slide_activity'):
        op.drop_table('slide_activity')
    
    # Remove new columns from existing tables (keep legacy columns)
    if _column_exists('ai_notes', 'faculty_id'):
        op.drop_column('ai_notes', 'faculty_id')
    if _column_exists('ai_notes', 'deleted_at'):
        op.drop_column('ai_notes', 'deleted_at')
    
    if _column_exists('slide_state', 'current_slide_number'):
        op.drop_column('slide_state', 'current_slide_number')
    if _column_exists('slide_state', 'slide_lock_enabled'):
        op.drop_column('slide_state', 'slide_lock_enabled')
    
    if _column_exists('sessions', 'end_time'):
        op.drop_column('sessions', 'end_time')
    if _column_exists('sessions', 'start_time'):
        op.drop_column('sessions', 'start_time')
    if _column_exists('sessions', 'faculty_id'):
        op.drop_column('sessions', 'faculty_id')
    
    if _column_exists('enrollments', 'created_at'):
        op.drop_column('enrollments', 'created_at')
    if _column_exists('enrollments', 'student_id'):
        op.drop_column('enrollments', 'student_id')
    
    if _column_exists('classes', 'deleted_at'):
        op.drop_column('classes', 'deleted_at')
    if _column_exists('classes', 'is_archived'):
        op.drop_column('classes', 'is_archived')
    if _column_exists('classes', 'academic_year'):
        op.drop_column('classes', 'academic_year')
    if _column_exists('classes', 'department'):
        op.drop_column('classes', 'department')
    
    if _column_exists('users', 'full_name'):
        op.drop_column('users', 'full_name')
    if _column_exists('users', 'deleted_at'):
        op.drop_column('users', 'deleted_at')
    
    # Drop indexes (idempotent)
    for idx_name, tbl_name in [
        ('ix_users_role', 'users'),
        ('ix_users_is_active', 'users'),
        ('ix_sessions_is_active', 'sessions'),
        ('ix_sessions_faculty_id', 'sessions'),
        ('ix_classes_is_archived', 'classes'),
        ('ix_classes_academic_year', 'classes'),
    ]:
        if _index_exists(idx_name):
            op.drop_index(idx_name, table_name=tbl_name)
