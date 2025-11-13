"""add CHECK not blank on documents title/content"""

from __future__ import annotations

import os
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e30ff99ccc7a"
down_revision: Union[str, Sequence[str], None] = "458a31d5300e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _schema() -> str:
    value = os.getenv("DATABASE_SCHEMA")
    if value:
        value = value.strip()
    return value or "public"


def upgrade() -> None:
    schema = _schema()

    op.execute(f"SET search_path TO {schema}, public")

    op.execute(
        f"""
        UPDATE {schema}.documents
        SET title = 'Untitled'
        WHERE title IS NULL OR char_length(btrim(title)) = 0
        """
    )
    op.execute(
        f"""
        UPDATE {schema}.documents
        SET content = '(empty)'
        WHERE content IS NULL OR char_length(btrim(content)) = 0
        """
    )

    op.execute(
        f"""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.conname = 'documents_title_not_blank'
              AND n.nspname = '{schema}'
              AND t.relname = 'documents'
        ) THEN
            ALTER TABLE {schema}.documents
            ADD CONSTRAINT documents_title_not_blank
                CHECK (char_length(btrim(title)) > 0);
        END IF;
    END$$;
    """
    )

    op.execute(
        f"""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.conname = 'documents_content_not_blank'
              AND n.nspname = '{schema}'
              AND t.relname = 'documents'
        ) THEN
            ALTER TABLE {schema}.documents
            ADD CONSTRAINT documents_content_not_blank
                CHECK (char_length(btrim(content)) > 0);
        END IF;
    END$$;
    """
    )


def downgrade() -> None:
    schema = _schema()
    op.execute(f"SET search_path TO {schema}, public")
    op.execute(f"ALTER TABLE {schema}.documents DROP CONSTRAINT IF EXISTS documents_content_not_blank;")
    op.execute(f"ALTER TABLE {schema}.documents DROP CONSTRAINT IF EXISTS documents_title_not_blank;")
