"""Add ai_notes table

Revision ID: 002
Revises: 001
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ai_notes table with inline foreign keys (required for SQLite)
    op.create_table(
        'ai_notes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('class_id', sa.UUID(), nullable=False),
        sa.Column('lesson_title', sa.String(length=500), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=False),
        sa.Column('structured_content', sa.Text(), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_notes_class_id'), 'ai_notes', ['class_id'])
    op.create_index(op.f('ix_ai_notes_created_by'), 'ai_notes', ['created_by'])


def downgrade() -> None:
    op.drop_index(op.f('ix_ai_notes_created_by'), table_name='ai_notes')
    op.drop_index(op.f('ix_ai_notes_class_id'), table_name='ai_notes')
    op.drop_table('ai_notes')
