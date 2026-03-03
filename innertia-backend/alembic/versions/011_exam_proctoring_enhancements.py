"""
Add Exam Proctoring and Enhanced Assessment Tables

Revision ID: 011_exam_proctoring_enhancements
Revises: 010_student_management
Create Date: 2026-03-01

This migration adds:
- exam_templates table
- violations table for proctoring
- proctoring_snapshots table
- live_monitoring_sessions table
- monitoring_events table
- student_progress_snapshots table
- Additional columns to existing tables for proctoring support
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011_exam_proctoring_enhancements'
down_revision = '010_student_management'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types for violations
    violation_type_enum = postgresql.ENUM(
        'tab_switch', 'fullscreen_exit', 'multiple_faces', 'face_not_visible',
        'phone_detected', 'screenshot', 'copy_paste', 'idle_timeout',
        name='violationtypeenum', create_type=False
    )
    violation_severity_enum = postgresql.ENUM(
        'low', 'medium', 'high', name='violationseverityenum', create_type=False
    )
    monitoring_event_type_enum = postgresql.ENUM(
        'violation', 'start', 'submit', 'pause', 'resume', 'auto_submit', 'terminate',
        name='monitoringeventtypeenum', create_type=False
    )
    exam_attempt_status_enum = postgresql.ENUM(
        'in_progress', 'submitted', 'auto_submitted', 'graded', 'terminated',
        name='examattemptstatusenum', create_type=False
    )

    violation_type_enum.create(op.get_bind(), checkfirst=True)
    violation_severity_enum.create(op.get_bind(), checkfirst=True)
    monitoring_event_type_enum.create(op.get_bind(), checkfirst=True)
    exam_attempt_status_enum.create(op.get_bind(), checkfirst=True)

    # Get inspector for checking existing tables
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Create exam_templates table
    if not inspector.has_table('exam_templates'):
        op.create_table(
            'exam_templates',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('duration_minutes', sa.Integer(), nullable=True),
            sa.Column('total_marks', sa.Integer(), nullable=True),
            sa.Column('passing_marks', sa.Integer(), nullable=True),
            sa.Column('shuffle_questions', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('shuffle_options', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('allow_navigation', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('allow_review', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('show_result_immediately', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('proctoring_config', postgresql.JSONB, nullable=True),
            sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_exam_template_college_id', 'exam_templates', ['college_id'])
        op.create_index('ix_exam_template_created_by', 'exam_templates', ['created_by'])
        op.create_index('ix_exam_template_deleted_at', 'exam_templates', ['deleted_at'])

    # Add missing columns to exams table
    # Check and add course_id
    exams_columns = [col['name'] for col in inspector.get_columns('exams')]
    if 'course_id' not in exams_columns:
        op.add_column('exams', sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('classes.id'), nullable=True))
        op.create_index('ix_exam_course_id', 'exams', ['course_id'])
    
    if 'exam_template_id' not in exams_columns:
        op.add_column('exams', sa.Column('exam_template_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exam_templates.id'), nullable=True))
        op.create_index('ix_exam_template_id', 'exams', ['exam_template_id'])
    
    if 'is_immediate' not in exams_columns:
        op.add_column('exams', sa.Column('is_immediate', sa.Boolean(), nullable=False, server_default='false'))
    
    if 'max_attempts' not in exams_columns:
        op.add_column('exams', sa.Column('max_attempts', sa.Integer(), nullable=True, server_default='1'))
    
    if 'proctoring_config' not in exams_columns:
        op.add_column('exams', sa.Column('proctoring_config', postgresql.JSONB, nullable=True))

    # Add missing columns to exam_questions table
    exam_questions_columns = [col['name'] for col in inspector.get_columns('exam_questions')]
    if 'negative_marks' not in exam_questions_columns:
        op.add_column('exam_questions', sa.Column('negative_marks', sa.Integer(), nullable=True, server_default='0'))
    
    if 'section' not in exam_questions_columns:
        op.add_column('exam_questions', sa.Column('section', sa.String(100), nullable=True))

    # Add missing columns to exam_submissions table (renaming to exam_attempts)
    exam_submissions_columns = [col['name'] for col in inspector.get_columns('exam_submissions')]
    
    # Rename exam_submissions to exam_attempts for clarity
    if 'device_fingerprint' not in exam_submissions_columns:
        op.add_column('exam_submissions', sa.Column('device_fingerprint', sa.Text(), nullable=True))
    
    if 'ip_address' not in exam_submissions_columns:
        op.add_column('exam_submissions', sa.Column('ip_address', sa.String(50), nullable=True))
    
    if 'user_agent' not in exam_submissions_columns:
        op.add_column('exam_submissions', sa.Column('user_agent', sa.Text(), nullable=True))
    
    if 'violation_count' not in exam_submissions_columns:
        op.add_column('exam_submissions', sa.Column('violation_count', sa.Integer(), nullable=False, server_default='0'))
    
    if 'is_cheating' not in exam_submissions_columns:
        op.add_column('exam_submissions', sa.Column('is_cheating', sa.Boolean(), nullable=False, server_default='false'))
    
    if 'proctoring_notes' not in exam_submissions_columns:
        op.add_column('exam_submissions', sa.Column('proctoring_notes', sa.Text(), nullable=True))

    # Add missing columns to assessments table
    assessments_columns = [col['name'] for col in inspector.get_columns('assessments')]
    if 'course_id' not in assessments_columns:
        op.add_column('assessments', sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('classes.id'), nullable=True))
        op.create_index('ix_assessment_course_id', 'assessments', ['course_id'])
    
    if 'allow_retake' not in assessments_columns:
        op.add_column('assessments', sa.Column('allow_retake', sa.Boolean(), nullable=False, server_default='false'))
    
    if 'max_attempts' not in assessments_columns:
        op.add_column('assessments', sa.Column('max_attempts', sa.Integer(), nullable=True))
    
    if 'shuffle_questions' not in assessments_columns:
        op.add_column('assessments', sa.Column('shuffle_questions', sa.Boolean(), nullable=False, server_default='false'))

    # Create violations table
    if not inspector.has_table('violations'):
        op.create_table(
            'violations',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('exam_submission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exam_submissions.id'), nullable=False),
            sa.Column('timestamp', sa.DateTime(), nullable=False),
            sa.Column('violation_type', violation_type_enum, nullable=False),
            sa.Column('severity', violation_severity_enum, nullable=False),
            sa.Column('details', postgresql.JSONB, nullable=True),
            sa.Column('acknowledged', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_violation_exam_submission_id', 'violations', ['exam_submission_id'])
        op.create_index('ix_violation_timestamp', 'violations', ['timestamp'])
        op.create_index('ix_violation_type', 'violations', ['violation_type'])
        op.create_index('ix_violation_severity', 'violations', ['severity'])
        op.create_index('ix_violation_acknowledged', 'violations', ['acknowledged'])

    # Create proctoring_snapshots table
    if not inspector.has_table('proctoring_snapshots'):
        op.create_table(
            'proctoring_snapshots',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('exam_submission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exam_submissions.id'), nullable=False),
            sa.Column('timestamp', sa.DateTime(), nullable=False),
            sa.Column('image_url', sa.Text(), nullable=True),
            sa.Column('face_data', postgresql.JSONB, nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_proctoring_snapshot_submission_id', 'proctoring_snapshots', ['exam_submission_id'])
        op.create_index('ix_proctoring_snapshot_timestamp', 'proctoring_snapshots', ['timestamp'])

    # Create live_monitoring_sessions table
    if not inspector.has_table('live_monitoring_sessions'):
        op.create_table(
            'live_monitoring_sessions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('exam_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exams.id'), nullable=False),
            sa.Column('faculty_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('started_at', sa.DateTime(), nullable=False),
            sa.Column('ended_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_monitoring_session_exam_id', 'live_monitoring_sessions', ['exam_id'])
        op.create_index('ix_monitoring_session_faculty_id', 'live_monitoring_sessions', ['faculty_id'])

    # Create monitoring_events table
    if not inspector.has_table('monitoring_events'):
        op.create_table(
            'monitoring_events',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('exam_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exams.id'), nullable=False),
            sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('event_type', monitoring_event_type_enum, nullable=False),
            sa.Column('details', postgresql.JSONB, nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_monitoring_event_exam_id', 'monitoring_events', ['exam_id'])
        op.create_index('ix_monitoring_event_student_id', 'monitoring_events', ['student_id'])
        op.create_index('ix_monitoring_event_type', 'monitoring_events', ['event_type'])
        op.create_index('ix_monitoring_event_created_at', 'monitoring_events', ['created_at'])

    # Create student_progress_snapshots table
    if not inspector.has_table('student_progress_snapshots'):
        op.create_table(
            'student_progress_snapshots',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('snapshot_date', sa.Date(), nullable=False),
            sa.Column('exams_taken', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('avg_score', sa.Float(), nullable=True),
            sa.Column('total_violations', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id'), nullable=True),
            sa.Column('year', sa.Integer(), nullable=True),
            sa.Column('data', postgresql.JSONB, nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_progress_snapshot_student_id', 'student_progress_snapshots', ['student_id'])
        op.create_index('ix_progress_snapshot_date', 'student_progress_snapshots', ['snapshot_date'])
        op.create_index('ix_progress_snapshot_department', 'student_progress_snapshots', ['department_id'])


def downgrade() -> None:
    # Drop new tables
    op.drop_table('student_progress_snapshots')
    op.drop_table('monitoring_events')
    op.drop_table('live_monitoring_sessions')
    op.drop_table('proctoring_snapshots')
    op.drop_table('violations')
    
    # Drop exam_templates
    op.drop_table('exam_templates')
    
    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS examattemptstatusenum')
    op.execute('DROP TYPE IF EXISTS monitoringeventtypeenum')
    op.execute('DROP TYPE IF EXISTS violationseverityenum')
    op.execute('DROP TYPE IF EXISTS violationtypeenum')
