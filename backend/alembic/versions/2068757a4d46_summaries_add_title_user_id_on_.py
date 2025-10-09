from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "2068757a4d46"
down_revision = "9f44d2e217f7"  # o la última que tengas; si no estás seguro, deja el valor que generó alembic
branch_labels = None
depends_on = None

def upgrade():
    # Usamos DO $$ ... $$ para que sea idempotente y específico a Postgres y al esquema 'studyforge'
    op.execute("""
    DO $$
    BEGIN
        -- title
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='studyforge' AND table_name='summaries' AND column_name='title'
        ) THEN
            ALTER TABLE studyforge.summaries
                ADD COLUMN title VARCHAR(200) NOT NULL DEFAULT '';
            ALTER TABLE studyforge.summaries
                ALTER COLUMN title DROP DEFAULT;
        END IF;

        -- user_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='studyforge' AND table_name='summaries' AND column_name='user_id'
        ) THEN
            ALTER TABLE studyforge.summaries
                ADD COLUMN user_id INTEGER;
            -- FK a users
            ALTER TABLE studyforge.summaries
                ADD CONSTRAINT summaries_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES studyforge.users(id);

            -- si la tabla está vacía, podemos poner NOT NULL directamente.
            -- si temes datos existentes sin user_id, podrías omitir el NOT NULL y setearlo luego.
            ALTER TABLE studyforge.summaries
                ALTER COLUMN user_id SET NOT NULL;
        END IF;
    END
    $$;
    """)

def downgrade():
    # quitamos lo añadido (idempotente también)
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='studyforge' AND table_name='summaries' AND column_name='user_id'
        ) THEN
            -- quitar FK si existe
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_schema='studyforge' AND table_name='summaries' AND constraint_name='summaries_user_id_fkey'
            ) THEN
                ALTER TABLE studyforge.summaries
                    DROP CONSTRAINT summaries_user_id_fkey;
            END IF;

            ALTER TABLE studyforge.summaries
                DROP COLUMN user_id;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='studyforge' AND table_name='summaries' AND column_name='title'
        ) THEN
            ALTER TABLE studyforge.summaries
                DROP COLUMN title;
        END IF;
    END
    $$;
    """)
