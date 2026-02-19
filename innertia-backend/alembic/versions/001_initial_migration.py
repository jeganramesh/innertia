"""
Initial migration - Create all tables.

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00
"""

from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all tables."""
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('role', sa.String(50), nullable=False, default='student'),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_verified', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    # Create refresh_tokens table with inline foreign key
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('revoked', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_refresh_tokens_token', 'refresh_tokens', ['token'], unique=True)
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    
    # Create classes table with inline foreign key to users
    op.create_table(
        'classes',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('faculty_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['faculty_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_classes_faculty_id', 'classes', ['faculty_id'])
    
    # Create sessions table with inline foreign key to classes
    op.create_table(
        'sessions',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('class_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('started_at', sa.DateTime, nullable=True),
        sa.Column('ended_at', sa.DateTime, nullable=True),
        sa.Column('is_active', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_sessions_class_id', 'sessions', ['class_id'])
    
    # Create enrollments table with inline foreign keys
    op.create_table(
        'enrollments',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('class_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('enrolled_at', sa.DateTime, default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_enrollments_user_id', 'enrollments', ['user_id'])
    op.create_index('ix_enrollments_class_id', 'enrollments', ['class_id'])
    
    # Create slide_state table with inline foreign key to sessions
    op.create_table(
        'slide_state',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('session_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('current_slide', sa.Integer, default=0),
        sa.Column('is_locked', sa.Boolean, default=False),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_slide_state_session_id', 'slide_state', ['session_id'])
    
    # Create notes table with inline foreign keys
    op.create_table(
        'notes',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('class_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('slide_number', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_notes_user_id', 'notes', ['user_id'])
    op.create_index('ix_notes_class_id', 'notes', ['class_id'])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_index('ix_notes_class_id', table_name='notes')
    op.drop_index('ix_notes_user_id', table_name='notes')
    op.drop_table('notes')
    
    op.drop_index('ix_slide_state_session_id', table_name='slide_state')
    op.drop_table('slide_state')
    
    op.drop_index('ix_enrollments_class_id', table_name='enrollments')
    op.drop_index('ix_enrollments_user_id', table_name='enrollments')
    op.drop_table('enrollments')
    
    op.drop_index('ix_sessions_class_id', table_name='sessions')
    op.drop_table('sessions')
    
    op.drop_index('ix_classes_faculty_id', table_name='classes')
    op.drop_table('classes')
    
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_token', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
