"""add college settings

Revises: 007_add_college_domain
Create Date: 2026-03-01 14:13:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '008_add_college_settings'
down_revision: Union[str, None] = '007_add_college_domain'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add settings column to colleges table
    op.add_column('colleges', sa.Column('settings', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove settings column from colleges table
    op.drop_column('colleges', 'settings')
