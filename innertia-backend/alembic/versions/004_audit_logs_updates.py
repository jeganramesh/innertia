"""
Migration: Update audit_logs table

Revision ID: 004
Revises: 003
Create Date: 2026-02-20
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change target_id from Integer to String(100) to support UUID
    op.alter_column(
        'audit_logs',
        'target_id',
        existing_type=sa.Integer(),
        type_=sa.String(100),
        existing_nullable=True,
        postgresql_using='target_id::text'
    )
    
    # Add ip_address column
    op.add_column(
        'audit_logs',
        sa.Column('ip_address', sa.String(45), nullable=True)
    )


def downgrade() -> None:
    # Remove ip_address column
    op.drop_column('audit_logs', 'ip_address')
    
    # Revert target_id to Integer
    op.alter_column(
        'audit_logs',
        'target_id',
        existing_type=sa.String(100),
        type_=sa.Integer(),
        existing_nullable=True
    )
