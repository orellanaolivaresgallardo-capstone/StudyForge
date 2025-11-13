"""ensure summaries have title and user relation"""

from __future__ import annotations

import os

from alembic import op

# revision identifiers, used by Alembic.
revision = "2068757a4d46"
down_revision = "9f44d2e217f7"
branch_labels = None
depends_on = None


def _schema() -> str:
    value = os.getenv("DATABASE_SCHEMA")
    if value:
        value = value.strip()
    return value or "public"


def upgrade():
    schema = _schema()
    op.execute(
        f"""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='{schema}' AND table_name='summaries' AND column_name='title'
        ) THEN
            ALTER TABLE {schema}.summaries
                ADD COLUMN title VARCHAR(200) NOT NULL DEFAULT '';
            ALTER TABLE {schema}.summaries
                ALTER COLUMN title DROP DEFAULT;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='{schema}' AND table_name='summaries' AND column_name='user_id'
        ) THEN
            ALTER TABLE {schema}.summaries
                ADD COLUMN user_id INTEGER;
            ALTER TABLE {schema}.summaries
                ADD CONSTRAINT summaries_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES {schema}.users(id);
            ALTER TABLE {schema}.summaries
                ALTER COLUMN user_id SET NOT NULL;
        END IF;
    END
    $$;
    """
    )


def downgrade():
    schema = _schema()
    op.execute(
        f"""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='{schema}' AND table_name='summaries' AND column_name='user_id'
        ) THEN
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_schema='{schema}' AND table_name='summaries' AND constraint_name='summaries_user_id_fkey'
            ) THEN
                ALTER TABLE {schema}.summaries
                    DROP CONSTRAINT summaries_user_id_fkey;
            END IF;

            ALTER TABLE {schema}.summaries
                DROP COLUMN user_id;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='{schema}' AND table_name='summaries' AND column_name='title'
        ) THEN
            ALTER TABLE {schema}.summaries
                DROP COLUMN title;
        END IF;
    END
    $$;
    """
    )
