"""Multi-tenant schema - colleges, features, and permissions

Revision ID: 005
Revises: 004
Create Date: 2026-02-28

This migration adds multi-tenant support with:
- colleges table
- college_id on users, classes, sessions, audit_logs
- college_features table
- role_feature_permissions table
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists."""
    bind = op.get_bind()
    result = bind.execute(
        sa.text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}')")
    ).fetchone()
    return result[0] if result else False


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists."""
    bind = op.get_bind()
    result = bind.execute(
        sa.text(f"SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '{table_name}' AND column_name = '{column_name}')")
    ).fetchone()
    return result[0] if result else False


def upgrade() -> None:
    # Create colleges table (idempotent)
    if not table_exists('colleges'):
        op.create_table(
            'colleges',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('code', sa.String(100), unique=True, nullable=False),
            sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_colleges_code', 'colleges', ['code'])
        op.create_index('ix_colleges_is_active', 'colleges', ['is_active'])
    
    # Add college_id to users table (idempotent)
    if not column_exists('users', 'college_id'):
        op.add_column('users', sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=True))
        op.create_index('ix_users_college_id', 'users', ['college_id'])
    
    # Add college_id to classes table (idempotent)
    if not column_exists('classes', 'college_id'):
        op.add_column('classes', sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False))
        op.create_index('ix_classes_college_id', 'classes', ['college_id'])
    
    # Add college_id to sessions table (idempotent)
    if not column_exists('sessions', 'college_id'):
        op.add_column('sessions', sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False))
        op.create_index('ix_sessions_college_id', 'sessions', ['college_id'])
    
    # Add college_id to audit_logs table (idempotent)
    if not column_exists('audit_logs', 'college_id'):
        op.add_column('audit_logs', sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=True))
        op.create_index('ix_audit_logs_college_id', 'audit_logs', ['college_id'])
    
    # Create college_features table (idempotent)
    if not table_exists('college_features'):
        op.create_table(
            'college_features',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id', ondelete='CASCADE'), nullable=False),
            sa.Column('feature_key', sa.String(100), nullable=False),
            sa.Column('is_enabled', sa.Boolean(), default=False, nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_college_features_college_id', 'college_features', ['college_id'])
        op.create_unique_constraint('uq_college_feature', 'college_features', ['college_id', 'feature_key'])
    
    # Create role_feature_permissions table (idempotent)
    if not table_exists('role_feature_permissions'):
        op.create_table(
            'role_feature_permissions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id', ondelete='CASCADE'), nullable=False),
            sa.Column('role', sa.String(50), nullable=False),
            sa.Column('feature_key', sa.String(100), nullable=False),
            sa.Column('is_enabled', sa.Boolean(), default=False, nullable=False),
        )
        op.create_index('ix_role_feature_permissions_college_id', 'role_feature_permissions', ['college_id'])
        op.create_index('ix_role_feature_permissions_role', 'role_feature_permissions', ['role'])
        op.create_unique_constraint('uq_role_feature_permission', 'role_feature_permissions', ['college_id', 'role', 'feature_key'])


def downgrade() -> None:
    # Drop role_feature_permissions table
    op.drop_constraint('uq_role_feature_permission', 'role_feature_permissions', type_='unique')
    op.drop_index('ix_role_feature_permissions_role', table_name='role_feature_permissions')
    op.drop_index('ix_role_feature_permissions_college_id', table_name='role_feature_permissions')
    op.drop_table('role_feature_permissions')
    
    # Drop college_features table
    op.drop_constraint('uq_college_feature', 'college_features', type_='unique')
    op.drop_index('ix_college_features_college_id', table_name='college_features')
    op.drop_table('college_features')
    
    # Remove college_id from audit_logs
    op.drop_index('ix_audit_logs_college_id', table_name='audit_logs')
    op.drop_column('audit_logs', 'college_id')
    
    # Remove college_id from sessions
    op.drop_index('ix_sessions_college_id', table_name='sessions')
    op.drop_column('sessions', 'college_id')
    
    # Remove college_id from classes
    op.drop_index('ix_classes_college_id', table_name='classes')
    op.drop_column('classes', 'college_id')
    
    # Remove college_id from users
    op.drop_index('ix_users_college_id', table_name='users')
    op.drop_column('users', 'college_id')
    
    # Drop colleges table
    op.drop_index('ix_colleges_is_active', table_name='colleges')
    op.drop_index('ix_colleges_code', table_name='colleges')
    op.drop_table('colleges')
