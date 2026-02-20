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


def upgrade() -> None:
    # =========================================================================
    # 1. Add columns to existing tables for soft delete support
    # =========================================================================
    
    # Add deleted_at to users table
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('full_name', sa.String(length=120), nullable=True))
    
    # Add is_archived, department, academic_year to classes table
    op.add_column('classes', sa.Column('department', sa.String(length=120), nullable=True))
    op.add_column('classes', sa.Column('academic_year', sa.String(length=20), nullable=True))
    op.add_column('classes', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('classes', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    
    # Add student_id, created_at to enrollments table
    op.add_column('enrollments', sa.Column('student_id', sa.UUID(), nullable=False))
    op.add_column('enrollments', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    
    # Add faculty_id to sessions table
    op.add_column('sessions', sa.Column('faculty_id', sa.UUID(), nullable=False))
    op.add_column('sessions', sa.Column('start_time', sa.DateTime(), nullable=True))
    op.add_column('sessions', sa.Column('end_time', sa.DateTime(), nullable=True))
    
    # Add slide_lock_enabled to slide_states table (rename from is_locked)
    op.add_column('slide_states', sa.Column('slide_lock_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('slide_states', sa.Column('current_slide_number', sa.Integer(), nullable=False, server_default='0'))
    
    # Add deleted_at to ai_notes table
    op.add_column('ai_notes', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('ai_notes', sa.Column('faculty_id', sa.UUID(), nullable=False))
    
    # Create indexes for new columns
    op.create_index('ix_classes_academic_year', 'classes', ['academic_year'])
    op.create_index('ix_classes_is_archived', 'classes', ['is_archived'])
    op.create_index('ix_sessions_faculty_id', 'sessions', ['faculty_id'])
    op.create_index('ix_sessions_is_active', 'sessions', ['is_active'])
    op.create_index('ix_users_is_active', 'users', ['is_active'])
    op.create_index('ix_users_role', 'users', ['role'])
    
    # =========================================================================
    # 2. Create slide_activity table (for cognitive heatmap)
    # =========================================================================
    
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
    op.create_index(op.f('ix_slide_activity_session_id'), 'slide_activity', ['session_id'])
    op.create_index(op.f('ix_slide_activity_student_id'), 'slide_activity', ['student_id'])
    op.create_index(op.f('ix_slide_activity_slide_number'), 'slide_activity', ['slide_number'])
    
    # =========================================================================
    # 3. Create audit_logs table (mandatory for production)
    # =========================================================================
    
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('performed_by', sa.UUID(), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=True),
        sa.Column('target_id', sa.Integer(), nullable=True),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_performed_by'), 'audit_logs', ['performed_by'])
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'])
    
    # =========================================================================
    # 4. Create system_settings table (feature toggles)
    # =========================================================================
    
    op.create_table(
        'system_settings',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index(op.f('ix_system_settings_key'), 'system_settings', ['key'], unique=True)
    
    # =========================================================================
    # 5. Seed default system settings
    # =========================================================================
    
    # Insert default feature toggles
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
    op.drop_index(op.f('ix_system_settings_key'), table_name='system_settings')
    op.drop_table('system_settings')
    
    # Drop audit_logs table
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_performed_by'), table_name='audit_logs')
    op.drop_table('audit_logs')
    
    # Drop slide_activity table
    op.drop_index(op.f('ix_slide_activity_slide_number'), table_name='slide_activity')
    op.drop_index(op.f('ix_slide_activity_student_id'), table_name='slide_activity')
    op.drop_index(op.f('ix_slide_activity_session_id'), table_name='slide_activity')
    op.drop_table('slide_activity')
    
    # Remove new columns from existing tables (keep legacy columns)
    op.drop_column('ai_notes', 'faculty_id')
    op.drop_column('ai_notes', 'deleted_at')
    
    op.drop_column('slide_states', 'current_slide_number')
    op.drop_column('slide_states', 'slide_lock_enabled')
    
    op.drop_column('sessions', 'end_time')
    op.drop_column('sessions', 'start_time')
    op.drop_column('sessions', 'faculty_id')
    
    op.drop_column('enrollments', 'created_at')
    op.drop_column('enrollments', 'student_id')
    
    op.drop_column('classes', 'deleted_at')
    op.drop_column('classes', 'is_archived')
    op.drop_column('classes', 'academic_year')
    op.drop_column('classes', 'department')
    
    op.drop_column('users', 'full_name')
    op.drop_column('users', 'deleted_at')
    
    # Drop indexes
    op.drop_index('ix_users_role', table_name='users')
    op.drop_index('ix_users_is_active', table_name='users')
    op.drop_index('ix_sessions_is_active', table_name='sessions')
    op.drop_index('ix_sessions_faculty_id', table_name='sessions')
    op.drop_index('ix_classes_is_archived', table_name='classes')
    op.drop_index('ix_classes_academic_year', table_name='classes')
