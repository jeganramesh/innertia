"""
Add Student Management Tables - Departments, Custom Fields

Revision ID: 010_student_management
Revises: 009_examination_assessment
Create Date: 2026-03-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '010_student_management'
down_revision = '009_examination_assessment'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM for custom field types
    custom_field_type_enum = postgresql.ENUM(
        'text', 'number', 'date', 'boolean', 'select', 
        name='customfieldtypeenum', 
        create_type=False
    )
    custom_field_type_enum.create(op.get_bind(), checkfirst=True)

    # =========================================================================
    # Create batches table
    # =========================================================================
    op.create_table(
        'batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('academic_year', sa.String(20), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_batch_college_id', 'batches', ['college_id'])
    op.create_index('ix_batch_college_active', 'batches', ['college_id', 'is_active'])

    # =========================================================================
    # Create departments table
    # =========================================================================
    op.create_table(
        'departments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_department_college_id', 'departments', ['college_id', 'is_active'])
    op.create_index('ix_department_college_code', 'departments', ['college_id', 'code'])

    # =========================================================================
    # Create custom_field_definitions table
    # =========================================================================
    op.create_table(
        'custom_field_definitions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('field_key', sa.String(100), nullable=False),
        sa.Column('field_type', custom_field_type_enum, nullable=False),
        sa.Column('options', postgresql.JSONB, nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_filterable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_custom_field_college_id', 'custom_field_definitions', ['college_id'])
    op.create_index('ix_custom_field_college_key', 'custom_field_definitions', ['college_id', 'field_key'], unique=True)

    # =========================================================================
    # Add columns to users table for student management
    # =========================================================================
    op.add_column('users', sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id'), nullable=True))
    op.add_column('users', sa.Column('batch_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('batches.id'), nullable=True))
    op.add_column('users', sa.Column('current_year', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('section', sa.String(10), nullable=True))
    op.add_column('users', sa.Column('register_number', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('custom_fields', postgresql.JSONB, nullable=True))

    # Create indexes for the new columns
    op.create_index('ix_users_department_college', 'users', ['college_id', 'department_id'])
    op.create_index('ix_users_batch_id', 'users', ['batch_id'])
    op.create_index('idx_users_custom_fields', 'users', ['custom_fields'], postgresql_using='gin')
    # Note: unique index for register_number will be handled at application level due to soft delete


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_users_custom_fields', table_name='users')
    op.drop_index('ix_users_batch_id', table_name='users')
    op.drop_index('ix_users_department_college', table_name='users')

    # Drop columns from users
    op.drop_column('users', 'custom_fields')
    op.drop_column('users', 'register_number')
    op.drop_column('users', 'section')
    op.drop_column('users', 'current_year')
    op.drop_column('users', 'batch_id')
    op.drop_column('users', 'department_id')

    # Drop custom_field_definitions table
    op.drop_index('ix_custom_field_college_key', table_name='custom_field_definitions')
    op.drop_index('ix_custom_field_college_id', table_name='custom_field_definitions')
    op.drop_table('custom_field_definitions')

    # Drop departments table
    op.drop_index('ix_department_college_code', table_name='departments')
    op.drop_index('ix_department_college_id', table_name='departments')
    op.drop_table('departments')

    # Drop batches table
    op.drop_index('ix_batch_college_active', table_name='batches')
    op.drop_index('ix_batch_college_id', table_name='batches')
    op.drop_table('batches')

    # Drop ENUM type
    custom_field_type_enum = postgresql.ENUM(
        'text', 'number', 'date', 'boolean', 'select', 
        name='customfieldtypeenum', 
        create_type=False
    )
    custom_field_type_enum.drop(op.get_bind(), checkfirst=True)
