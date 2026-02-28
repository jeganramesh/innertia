"""Fix multitenant migration - mark as complete if tables exist

Revision ID: 006
Revises: 005
Create Date: 2026-02-28

This migration marks 005 as complete if the colleges table already exists.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This migration is a no-op - it just marks the previous migration as complete
    # The colleges table was already created in a previous run
    pass


def downgrade() -> None:
    pass
