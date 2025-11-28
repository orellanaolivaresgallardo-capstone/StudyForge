"""add_denormalization_triggers

Revision ID: 5b9ce8f49f71
Revises: c7764155e86b
Create Date: 2025-11-28 20:27:25.132783

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b9ce8f49f71'
down_revision: Union[str, Sequence[str], None] = 'c7764155e86b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add triggers for denormalization."""

    # Trigger 1: Update Summary cache when Document title/filename changes
    op.execute("""
        CREATE OR REPLACE FUNCTION studyforge.update_summary_document_cache()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE studyforge.summaries
            SET
                source_document_title = NEW.title,
                source_document_filename = NEW.file_name
            WHERE document_id = NEW.id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER trigger_update_summary_document_cache
        AFTER UPDATE OF title, file_name ON studyforge.documents
        FOR EACH ROW
        WHEN (OLD.title IS DISTINCT FROM NEW.title OR OLD.file_name IS DISTINCT FROM NEW.file_name)
        EXECUTE FUNCTION studyforge.update_summary_document_cache();
    """)

    # Trigger 2: Update QuizAttempt cache when Quiz title changes
    op.execute("""
        CREATE OR REPLACE FUNCTION studyforge.update_quiz_attempt_cache()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE studyforge.quiz_attempts
            SET quiz_title = NEW.title
            WHERE quiz_id = NEW.id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER trigger_update_quiz_attempt_cache
        AFTER UPDATE OF title ON studyforge.quizzes
        FOR EACH ROW
        WHEN (OLD.title IS DISTINCT FROM NEW.title)
        EXECUTE FUNCTION studyforge.update_quiz_attempt_cache();
    """)


def downgrade() -> None:
    """Downgrade schema - Remove triggers."""

    # Drop triggers and functions in reverse order
    op.execute("DROP TRIGGER IF EXISTS trigger_update_quiz_attempt_cache ON studyforge.quizzes;")
    op.execute("DROP FUNCTION IF EXISTS studyforge.update_quiz_attempt_cache();")

    op.execute("DROP TRIGGER IF EXISTS trigger_update_summary_document_cache ON studyforge.documents;")
    op.execute("DROP FUNCTION IF EXISTS studyforge.update_summary_document_cache();")
