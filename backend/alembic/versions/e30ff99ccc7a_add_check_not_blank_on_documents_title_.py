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


def upgrade() -> None:
    """Upgrade schema."""
    # Asegura que operamos sobre el schema correcto en esta sesión
    op.execute("SET search_path TO studyforge, public")

    # Normaliza datos previos para que los CHECK no fallen
    op.execute("""
        UPDATE studyforge.documents
        SET title = 'Untitled'
        WHERE title IS NULL OR char_length(btrim(title)) = 0
    """)
    op.execute("""
        UPDATE studyforge.documents
        SET content = '(empty)'
        WHERE content IS NULL OR char_length(btrim(content)) = 0
    """)

    # Agrega los CHECKs (no permitir vacíos/solo espacios)
    op.execute("""
        ALTER TABLE studyforge.documents
        ADD CONSTRAINT documents_title_not_blank
            CHECK (char_length(btrim(title)) > 0),
        ADD CONSTRAINT documents_content_not_blank
            CHECK (char_length(btrim(content)) > 0)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("SET search_path TO studyforge, public")
    op.execute("""
        ALTER TABLE studyforge.documents
        DROP CONSTRAINT IF EXISTS documents_title_not_blank,
        DROP CONSTRAINT IF EXISTS documents_content_not_blank
    """)
