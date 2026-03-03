"""
Add Examination and Assessment Tables

Revision ID: 009_examination_assessment
Revises: 008_add_college_settings
Create Date: 2026-03-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009_examination_assessment'
down_revision = '008_add_college_settings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types
    exam_type_enum = postgresql.ENUM('quiz', 'midterm', 'final', 'practical', name='examtypeenum', create_type=False)
    exam_status_enum = postgresql.ENUM('draft', 'scheduled', 'ongoing', 'completed', 'cancelled', name='examstatusenum', create_type=False)
    assessment_type_enum = postgresql.ENUM('quiz', 'assignment', 'lab', name='assessmenttypeenum', create_type=False)
    assessment_status_enum = postgresql.ENUM('draft', 'published', 'closed', name='assessmentstatusenum', create_type=False)
    question_type_enum = postgresql.ENUM('mcq', 'true_false', 'short_answer', 'essay', name='questiontypeenum', create_type=False)
    submission_status_enum = postgresql.ENUM('in_progress', 'submitted', 'graded', name='submissionstatusenum', create_type=False)

    exam_type_enum.create(op.get_bind(), checkfirst=True)
    exam_status_enum.create(op.get_bind(), checkfirst=True)
    assessment_type_enum.create(op.get_bind(), checkfirst=True)
    assessment_status_enum.create(op.get_bind(), checkfirst=True)
    question_type_enum.create(op.get_bind(), checkfirst=True)
    submission_status_enum.create(op.get_bind(), checkfirst=True)

    # Get inspector for checking existing tables
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Create exams table
    if not inspector.has_table('exams'):
        op.create_table(
            'exams',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False),
            sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('exam_type', exam_type_enum, nullable=False, server_default='quiz'),
            sa.Column('status', exam_status_enum, nullable=False, server_default='draft'),
            sa.Column('scheduled_at', sa.DateTime(), nullable=True),
            sa.Column('duration_minutes', sa.Integer(), nullable=True),
            sa.Column('total_marks', sa.Integer(), nullable=True),
            sa.Column('passing_marks', sa.Integer(), nullable=True),
            sa.Column('instructions', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_exam_college_id', 'exams', ['college_id'])
        op.create_index('ix_exam_status', 'exams', ['status'])
        op.create_index('ix_exam_scheduled_at', 'exams', ['scheduled_at'])
        op.create_index('ix_exam_deleted_at', 'exams', ['deleted_at'])
        op.create_index('ix_exam_college_status_scheduled', 'exams', ['college_id', 'status', 'scheduled_at'])

    # Create exam_questions table
    if not inspector.has_table('exam_questions'):
        op.create_table(
            'exam_questions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('exam_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exams.id'), nullable=False),
            sa.Column('question_text', sa.Text(), nullable=False),
            sa.Column('question_type', question_type_enum, nullable=False, server_default='mcq'),
            sa.Column('options', postgresql.JSON, nullable=True),
            sa.Column('correct_answer', sa.Text(), nullable=True),
            sa.Column('marks', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_exam_question_exam_id', 'exam_questions', ['exam_id'])
        op.create_index('ix_exam_question_deleted_at', 'exam_questions', ['deleted_at'])

    # Create exam_submissions table
    if not inspector.has_table('exam_submissions'):
        op.create_table(
            'exam_submissions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('exam_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exams.id'), nullable=False),
            sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('started_at', sa.DateTime(), nullable=False),
            sa.Column('submitted_at', sa.DateTime(), nullable=True),
            sa.Column('status', submission_status_enum, nullable=False, server_default='in_progress'),
            sa.Column('total_obtained', sa.Integer(), nullable=True),
            sa.Column('graded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
            sa.Column('graded_at', sa.DateTime(), nullable=True),
            sa.Column('answers', postgresql.JSON, nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_exam_submission_exam_id', 'exam_submissions', ['exam_id'])
        op.create_index('ix_exam_submission_student_id', 'exam_submissions', ['student_id'])
        op.create_index('ix_exam_submission_status', 'exam_submissions', ['status'])
        op.create_unique_constraint('uq_exam_submission', 'exam_submissions', ['exam_id', 'student_id'])

    # Create assessments table
    if not inspector.has_table('assessments'):
        op.create_table(
            'assessments',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('college_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('colleges.id'), nullable=False),
            sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('assessment_type', assessment_type_enum, nullable=False, server_default='quiz'),
            sa.Column('status', assessment_status_enum, nullable=False, server_default='draft'),
            sa.Column('due_at', sa.DateTime(), nullable=True),
            sa.Column('total_marks', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_assessment_college_id', 'assessments', ['college_id'])
        op.create_index('ix_assessment_status', 'assessments', ['status'])
        op.create_index('ix_assessment_due_at', 'assessments', ['due_at'])
        op.create_index('ix_assessment_deleted_at', 'assessments', ['deleted_at'])
        op.create_index('ix_assessment_college_type_due', 'assessments', ['college_id', 'assessment_type', 'due_at'])

    # Create assessment_questions table
    if not inspector.has_table('assessment_questions'):
        op.create_table(
            'assessment_questions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('assessment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assessments.id'), nullable=False),
            sa.Column('question_text', sa.Text(), nullable=False),
            sa.Column('question_type', question_type_enum, nullable=False, server_default='mcq'),
            sa.Column('options', postgresql.JSON, nullable=True),
            sa.Column('correct_answer', sa.Text(), nullable=True),
            sa.Column('marks', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_assessment_question_assessment_id', 'assessment_questions', ['assessment_id'])
        op.create_index('ix_assessment_question_deleted_at', 'assessment_questions', ['deleted_at'])

    # Create assessment_submissions table
    if not inspector.has_table('assessment_submissions'):
        op.create_table(
            'assessment_submissions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('assessment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assessments.id'), nullable=False),
            sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('started_at', sa.DateTime(), nullable=False),
            sa.Column('submitted_at', sa.DateTime(), nullable=True),
            sa.Column('status', submission_status_enum, nullable=False, server_default='in_progress'),
            sa.Column('total_obtained', sa.Integer(), nullable=True),
            sa.Column('graded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
            sa.Column('graded_at', sa.DateTime(), nullable=True),
            sa.Column('answers', postgresql.JSON, nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_assessment_submission_assessment_id', 'assessment_submissions', ['assessment_id'])
        op.create_index('ix_assessment_submission_student_id', 'assessment_submissions', ['student_id'])
        op.create_index('ix_assessment_submission_status', 'assessment_submissions', ['status'])
        op.create_unique_constraint('uq_assessment_submission', 'assessment_submissions', ['assessment_id', 'student_id'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('assessment_submissions')
    op.drop_table('assessment_questions')
    op.drop_table('assessments')
    op.drop_table('exam_submissions')
    op.drop_table('exam_questions')
    op.drop_table('exams')

    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS submissionstatusenum')
    op.execute('DROP TYPE IF EXISTS questiontypeenum')
    op.execute('DROP TYPE IF EXISTS assessmentstatusenum')
    op.execute('DROP TYPE IF EXISTS assessmenttypeenum')
    op.execute('DROP TYPE IF EXISTS examstatusenum')
    op.execute('DROP TYPE IF EXISTS examtypeenum')
