"""summaries: add title/content/user_id + rel with documents & users

Revision ID: 9f44d2e217f7
Revises: e30ff99ccc7a
Create Date: 2025-10-08 16:33:50.596998
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9f44d2e217f7'
down_revision: Union[str, Sequence[str], None] = 'e30ff99ccc7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema (idempotente, schema-qualificado)."""

    # ---- DOCUMENTS ----
    # Default de created_at (reaplicar no falla)
    op.execute("""
        ALTER TABLE studyforge.documents
        ALTER COLUMN created_at SET DEFAULT now();
    """)

    # FK documents.user_id -> users.id (elimino cualquiera previo y creo el correcto si falta)
    op.execute("""
        ALTER TABLE studyforge.documents
        DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
    """)
    op.execute("""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'documents_user_id_fkey'
          AND conrelid = 'studyforge.documents'::regclass
      ) THEN
        ALTER TABLE studyforge.documents
        ADD CONSTRAINT documents_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES studyforge.users(id);
      END IF;
    END$$;
    """)

    # ---- QUIZZES (este cambio venía del autogenerate histórico) ----
    # FK quizzes.document_id -> documents.id (re-crear si falta)
    op.execute("""
        ALTER TABLE studyforge.quizzes
        DROP CONSTRAINT IF EXISTS quizzes_document_id_fkey;
    """)
    op.execute("""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quizzes_document_id_fkey'
          AND conrelid = 'studyforge.quizzes'::regclass
      ) THEN
        ALTER TABLE studyforge.quizzes
        ADD CONSTRAINT quizzes_document_id_fkey
        FOREIGN KEY (document_id) REFERENCES studyforge.documents(id);
      END IF;
    END$$;
    """)

    # Columnas antiguas de un esquema previo (elimínalas solo si existen)
    op.execute("ALTER TABLE studyforge.quizzes DROP COLUMN IF EXISTS created_at;")
    op.execute("ALTER TABLE studyforge.quizzes DROP COLUMN IF EXISTS options;")
    op.execute("ALTER TABLE studyforge.quizzes DROP COLUMN IF EXISTS difficulty;")
    op.execute("ALTER TABLE studyforge.quizzes DROP COLUMN IF EXISTS answer;")
    op.execute("ALTER TABLE studyforge.quizzes DROP COLUMN IF EXISTS question;")

    # ---- SUMMARIES ----
    # title / user_id (agregar si no existen) y defaults/NOT NULL seguros
    op.execute("""
        ALTER TABLE studyforge.summaries
        ADD COLUMN IF NOT EXISTS title VARCHAR(200);
    """)
    op.execute("""
        ALTER TABLE studyforge.summaries
        ADD COLUMN IF NOT EXISTS user_id INTEGER;
    """)
    op.execute("""
        ALTER TABLE studyforge.summaries
        ALTER COLUMN created_at SET DEFAULT now();
    """)

    # NOT NULL (si ya está, no pasa nada; si hubiera NULLs, esto fallaría.
    # Asumimos que ya no hay NULLs porque la DB ya estaba usando estos campos)
    op.execute("""
        ALTER TABLE studyforge.summaries
        ALTER COLUMN title SET NOT NULL;
    """)
    op.execute("""
        ALTER TABLE studyforge.summaries
        ALTER COLUMN user_id SET NOT NULL;
    """)

    # Índice (si no existiera)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_studyforge_summaries_id
        ON studyforge.summaries (id);
    """)

    # FKs de summaries
    op.execute("""
        ALTER TABLE studyforge.summaries
        DROP CONSTRAINT IF EXISTS summaries_document_id_fkey;
    """)
    op.execute("""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'summaries_document_id_fkey'
          AND conrelid = 'studyforge.summaries'::regclass
      ) THEN
        ALTER TABLE studyforge.summaries
        ADD CONSTRAINT summaries_document_id_fkey
        FOREIGN KEY (document_id) REFERENCES studyforge.documents(id);
      END IF;
    END$$;
    """)

    op.execute("""
        ALTER TABLE studyforge.summaries
        DROP CONSTRAINT IF EXISTS summaries_user_id_fkey;
    """)
    op.execute("""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'summaries_user_id_fkey'
          AND conrelid = 'studyforge.summaries'::regclass
      ) THEN
        ALTER TABLE studyforge.summaries
        ADD CONSTRAINT summaries_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES studyforge.users(id);
      END IF;
    END$$;
    """)

    # ---- USERS ----
    # Default de created_at
    op.execute("""
        ALTER TABLE studyforge.users
        ALTER COLUMN created_at SET DEFAULT now();
    """)

    # Cambiar unique constraint por índice único (idempotente)
    op.execute("""
        ALTER TABLE studyforge.users
        DROP CONSTRAINT IF EXISTS users_email_key;
    """)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_studyforge_users_email
        ON studyforge.users (email);
    """)


def downgrade() -> None:
    """Downgrade schema (best-effort, idempotente)."""

    # Revertir el índice único a constraint (opcional; mantener idempotencia)
    op.execute("""
        DROP INDEX IF EXISTS ix_studyforge_users_email;
    """)
    op.execute("""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_email_key'
          AND conrelid = 'studyforge.users'::regclass
      ) THEN
        ALTER TABLE studyforge.users
        ADD CONSTRAINT users_email_key UNIQUE (email);
      END IF;
    END$$;
    """)

    # Quitar FKs de summaries (si existen) y recrear sin esquema (como estaba antes)
    op.execute("""
        ALTER TABLE studyforge.summaries
        DROP CONSTRAINT IF EXISTS summaries_user_id_fkey;
    """)
    op.execute("""
        ALTER TABLE studyforge.summaries
        DROP CONSTRAINT IF EXISTS summaries_document_id_fkey;
    """)
    op.execute("""
        ALTER TABLE studyforge.summaries
        ALTER COLUMN title DROP NOT NULL;
    """)
    op.execute("""
        ALTER TABLE studyforge.summaries
        ALTER COLUMN user_id DROP NOT NULL;
    """)
    # Índice de summaries
    op.execute("""
        DROP INDEX IF EXISTS ix_studyforge_summaries_id;
    """)

    # FKs de quizzes (si existen)
    op.execute("""
        ALTER TABLE studyforge.quizzes
        DROP CONSTRAINT IF EXISTS quizzes_document_id_fkey;
    """)

    # FKs de documents (si existen)
    op.execute("""
        ALTER TABLE studyforge.documents
        DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
    """)
