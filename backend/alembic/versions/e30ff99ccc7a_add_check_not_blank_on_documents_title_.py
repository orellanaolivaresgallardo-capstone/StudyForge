"""add CHECK not blank on documents title/content

Revision ID: e30ff99ccc7a
Revises: 458a31d5300e
Create Date: 2025-10-06 22:01:35.365862
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e30ff99ccc7a"
down_revision: Union[str, Sequence[str], None] = "458a31d5300e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SCHEMA = "studyforge"


def upgrade() -> None:
    """Upgrade schema."""
    # Asegura que operamos sobre el schema correcto en esta sesión
    op.execute(f"SET search_path TO {SCHEMA}, public")

    # Normaliza datos previos para que los CHECK no fallen
    op.execute(f"""
        UPDATE {SCHEMA}.documents
        SET title = 'Untitled'
        WHERE title IS NULL OR char_length(btrim(title)) = 0
    """)
    op.execute(f"""
        UPDATE {SCHEMA}.documents
        SET content = '(empty)'
        WHERE content IS NULL OR char_length(btrim(content)) = 0
    """)

    # Agrega los CHECKs sólo si no existen (Postgres no soporta IF NOT EXISTS en ADD CONSTRAINT)
    # TITLE
    op.execute(f"""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.conname = 'documents_title_not_blank'
              AND n.nspname = '{SCHEMA}'
              AND t.relname = 'documents'
        ) THEN
            ALTER TABLE {SCHEMA}.documents
            ADD CONSTRAINT documents_title_not_blank
                CHECK (char_length(btrim(title)) > 0);
        END IF;
    END$$;
    """)

    # CONTENT
    op.execute(f"""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.conname = 'documents_content_not_blank'
              AND n.nspname = '{SCHEMA}'
              AND t.relname = 'documents'
        ) THEN
            ALTER TABLE {SCHEMA}.documents
            ADD CONSTRAINT documents_content_not_blank
                CHECK (char_length(btrim(content)) > 0);
        END IF;
    END$$;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(f"SET search_path TO {SCHEMA}, public")
    # Drops tolerantes (no fallan si ya no existen)
    op.execute(f"ALTER TABLE {SCHEMA}.documents DROP CONSTRAINT IF EXISTS documents_content_not_blank;")
    op.execute(f"ALTER TABLE {SCHEMA}.documents DROP CONSTRAINT IF EXISTS documents_title_not_blank;")
