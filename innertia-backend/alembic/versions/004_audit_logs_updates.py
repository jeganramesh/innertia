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


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists in a table (SQLite compatible)."""
    bind = op.get_bind()
    result = bind.execute(sa.text(f"PRAGMA table_info('{table_name}')")).fetchall()
    return any(row[1] == column_name for row in result)


def upgrade() -> None:
    """
    Update audit_logs table.
    
    Note: SQLite doesn't support ALTER COLUMN, so we skip the type change
    and only add the ip_address column if it doesn't exist.
    """
    
    # Add ip_address column if it doesn't already exist
    if not _column_exists('audit_logs', 'ip_address'):
        op.add_column(
            'audit_logs',
            sa.Column('ip_address', sa.String(45), nullable=True)
        )


def downgrade() -> None:
    """Remove ip_address column."""
    
    if _column_exists('audit_logs', 'ip_address'):
        op.drop_column('audit_logs', 'ip_address')
