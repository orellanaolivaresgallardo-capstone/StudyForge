"""Repair quizzes schema and add quiz_* tables (idempotent)"""

from alembic import op
import sqlalchemy as sa

# --- Identificadores de Alembic ---
revision = "36fd62af36de"
down_revision = "a925621768cb"
branch_labels = None
depends_on = None

SCHEMA = "studyforge"

def upgrade() -> None:
    # --- QUIZZES: columnas nuevas y defaults/índices/FKs ---

    # title
    op.execute(f"""
        ALTER TABLE {SCHEMA}.quizzes
        ADD COLUMN IF NOT EXISTS title VARCHAR(200);
    """)
    op.execute(f"""
        ALTER TABLE {SCHEMA}.quizzes
        ALTER COLUMN title SET DEFAULT 'Quiz automático';
    """)

    # user_id
    op.execute(f"""
        ALTER TABLE {SCHEMA}.quizzes
        ADD COLUMN IF NOT EXISTS user_id INTEGER;
    """)

    # size
    op.execute(f"""
        ALTER TABLE {SCHEMA}.quizzes
        ADD COLUMN IF NOT EXISTS size INTEGER;
    """)

    # created_at default
    op.execute(f"""
        ALTER TABLE {SCHEMA}.quizzes
        ALTER COLUMN created_at SET DEFAULT now();
    """)

    # Backfill para user_id (desde documents) y size por defecto
    op.execute(f"""
        UPDATE {SCHEMA}.quizzes q
        SET user_id = d.user_id
        FROM {SCHEMA}.documents d
        WHERE q.document_id = d.id AND q.user_id IS NULL;
    """)
    op.execute(f"""
        UPDATE {SCHEMA}.quizzes
        SET size = 5
        WHERE size IS NULL;
    """)

    # NOT NULL (tras backfill)
    op.execute(f"ALTER TABLE {SCHEMA}.quizzes ALTER COLUMN title SET NOT NULL;")
    op.execute(f"ALTER TABLE {SCHEMA}.quizzes ALTER COLUMN user_id SET NOT NULL;")
    op.execute(f"ALTER TABLE {SCHEMA}.quizzes ALTER COLUMN size SET NOT NULL;")

    # Índices idempotentes
    op.execute(f"""
        CREATE INDEX IF NOT EXISTS ix_{SCHEMA}_quizzes_document_id
        ON {SCHEMA}.quizzes (document_id);
    """)
    op.execute(f"""
        CREATE INDEX IF NOT EXISTS ix_{SCHEMA}_quizzes_user_id
        ON {SCHEMA}.quizzes (user_id);
    """)

    # FKs correctos
    op.execute(f"""
        ALTER TABLE {SCHEMA}.quizzes
        DROP CONSTRAINT IF EXISTS quizzes_document_id_fkey;
    """)
    op.execute(f"""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quizzes_document_id_fkey'
          AND conrelid = '{SCHEMA}.quizzes'::regclass
      ) THEN
        ALTER TABLE {SCHEMA}.quizzes
        ADD CONSTRAINT quizzes_document_id_fkey
        FOREIGN KEY (document_id) REFERENCES {SCHEMA}.documents(id) ON DELETE CASCADE;
      END IF;
    END$$;
    """)

    op.execute(f"""
        ALTER TABLE {SCHEMA}.quizzes
        DROP CONSTRAINT IF EXISTS quizzes_user_id_fkey;
    """)
    op.execute(f"""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quizzes_user_id_fkey'
          AND conrelid = '{SCHEMA}.quizzes'::regclass
      ) THEN
        ALTER TABLE {SCHEMA}.quizzes
        ADD CONSTRAINT quizzes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES {SCHEMA}.users(id);
      END IF;
    END$$;
    """)

    # Quita columnas viejas si aún existen
    for old_col in ("question", "answer", "options", "difficulty"):
        op.execute(f"ALTER TABLE {SCHEMA}.quizzes DROP COLUMN IF EXISTS {old_col};")

    # --- QUIZ_QUESTIONS: crear si no existe ---
    op.execute(f"""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = '{SCHEMA}' AND table_name = 'quiz_questions'
      ) THEN
        CREATE TABLE {SCHEMA}.quiz_questions (
          id SERIAL PRIMARY KEY,
          quiz_id INTEGER NOT NULL,
          question TEXT NOT NULL,
          options_json TEXT NOT NULL,
          answer_index INTEGER NOT NULL,
          explanation TEXT,
          CONSTRAINT quiz_questions_quiz_id_fkey
            FOREIGN KEY (quiz_id) REFERENCES {SCHEMA}.quizzes(id) ON DELETE CASCADE
        );
      END IF;
    END$$;
    """)
    op.execute(f"""
        CREATE INDEX IF NOT EXISTS ix_{SCHEMA}_quiz_questions_quiz_id
        ON {SCHEMA}.quiz_questions (quiz_id);
    """)

    # --- QUIZ_RESULTS: crear si no existe ---
    op.execute(f"""
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = '{SCHEMA}' AND table_name = 'quiz_results'
      ) THEN
        CREATE TABLE {SCHEMA}.quiz_results (
          id SERIAL PRIMARY KEY,
          quiz_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          CONSTRAINT quiz_results_quiz_id_fkey
            FOREIGN KEY (quiz_id) REFERENCES {SCHEMA}.quizzes(id) ON DELETE CASCADE,
          CONSTRAINT quiz_results_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES {SCHEMA}.users(id)
        );
      END IF;
    END$$;
    """)
    op.execute(f"""
        CREATE INDEX IF NOT EXISTS ix_{SCHEMA}_quiz_results_quiz_id
        ON {SCHEMA}.quiz_results (quiz_id);
    """)
    op.execute(f"""
        CREATE INDEX IF NOT EXISTS ix_{SCHEMA}_quiz_results_user_id
        ON {SCHEMA}.quiz_results (user_id);
    """)


def downgrade() -> None:
    # Best-effort: limpiamos objetos creados por este patch
    op.execute(f"DROP INDEX IF EXISTS ix_{SCHEMA}_quiz_results_user_id;")
    op.execute(f"DROP INDEX IF EXISTS ix_{SCHEMA}_quiz_results_quiz_id;")
    op.execute(f"DROP INDEX IF EXISTS ix_{SCHEMA}_quiz_questions_quiz_id;")

    op.execute(f"DROP TABLE IF EXISTS {SCHEMA}.quiz_results;")
    op.execute(f"DROP TABLE IF EXISTS {SCHEMA}.quiz_questions;")

    op.execute(f"DROP INDEX IF EXISTS ix_{SCHEMA}_quizzes_user_id;")
    op.execute(f"DROP INDEX IF EXISTS ix_{SCHEMA}_quizzes_document_id;")
    # (No revertimos NOT NULL/FKs en quizzes para no romper integridad por accidente)
