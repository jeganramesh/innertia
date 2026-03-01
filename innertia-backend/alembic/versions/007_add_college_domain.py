"""Add domain column to colleges table

Revision ID: 007
Revises: 006
Create Date: 2026-03-01

This migration adds the domain column to the colleges table.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add domain column to colleges table (idempotent)
    # Check if column already exists
    bind = op.get_bind()
    result = bind.execute(
        sa.text("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'colleges' AND column_name = 'domain')")
    ).fetchone()
    
    if not result or not result[0]:
        op.add_column('colleges', sa.Column('domain', sa.String(255), nullable=True))
        # Create index on domain for faster lookups
        op.create_index('ix_colleges_domain', 'colleges', ['domain'])


def downgrade() -> None:
    # Drop domain column
    op.drop_index('ix_colleges_domain', table_name='colleges')
    op.drop_column('colleges', 'domain')
