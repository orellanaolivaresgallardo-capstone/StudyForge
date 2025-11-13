"""summaries: add title/content/user_id + rel with documents & users"""

from __future__ import annotations

import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "9f44d2e217f7"
down_revision: Union[str, Sequence[str], None] = "e30ff99ccc7a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _schema() -> str | None:
    value = os.getenv("DATABASE_SCHEMA")
    if value:
        value = value.strip()
    return value or None


def _index(name: str, schema: str | None) -> str:
    return f"ix_{schema}_{name}" if schema else f"ix_{name}"


def upgrade() -> None:
    schema = _schema()

    op.alter_column(
        "documents",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=True,
        schema=schema,
    )
    op.drop_constraint(op.f("documents_user_id_fkey"), "documents", type_="foreignkey")
    op.create_foreign_key(
        None,
        "documents",
        "users",
        ["user_id"],
        ["id"],
        source_schema=schema,
        referent_schema=schema,
    )
    op.drop_constraint(op.f("quizzes_document_id_fkey"), "quizzes", type_="foreignkey")
    op.create_foreign_key(
        None,
        "quizzes",
        "documents",
        ["document_id"],
        ["id"],
        source_schema=schema,
        referent_schema=schema,
    )
    op.drop_column("quizzes", "created_at")
    op.drop_column("quizzes", "options")
    op.drop_column("quizzes", "difficulty")
    op.drop_column("quizzes", "answer")
    op.drop_column("quizzes", "question")
    op.add_column("summaries", sa.Column("title", sa.String(length=200), nullable=False))
    op.add_column("summaries", sa.Column("user_id", sa.Integer(), nullable=False))
    op.alter_column(
        "summaries",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=True,
        schema=schema,
    )
    op.create_index(
        _index("summaries_id", schema),
        "summaries",
        ["id"],
        unique=False,
        schema=schema,
    )
    op.drop_constraint(op.f("summaries_document_id_fkey"), "summaries", type_="foreignkey")
    op.create_foreign_key(
        None,
        "summaries",
        "documents",
        ["document_id"],
        ["id"],
        source_schema=schema,
        referent_schema=schema,
    )
    op.create_foreign_key(
        None,
        "summaries",
        "users",
        ["user_id"],
        ["id"],
        source_schema=schema,
        referent_schema=schema,
    )
    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=True,
        schema=schema,
    )
    op.drop_constraint(op.f("users_email_key"), "users", type_="unique")
    op.create_index(
        _index("users_email", schema),
        "users",
        ["email"],
        unique=True,
        schema=schema,
    )


def downgrade() -> None:
    schema = _schema()

    op.drop_index(_index("users_email", schema), table_name="users", schema=schema)
    op.create_unique_constraint(op.f("users_email_key"), "users", ["email"], postgresql_nulls_not_distinct=False)
    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=None,
        existing_nullable=True,
        schema=schema,
    )
    op.drop_constraint(None, "summaries", schema=schema, type_="foreignkey")
    op.drop_constraint(None, "summaries", schema=schema, type_="foreignkey")
    op.create_foreign_key(op.f("summaries_document_id_fkey"), "summaries", "documents", ["document_id"], ["id"], source_schema=schema, referent_schema=schema)
    op.drop_index(_index("summaries_id", schema), table_name="summaries", schema=schema)
    op.alter_column(
        "summaries",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=None,
        existing_nullable=True,
        schema=schema,
    )
    op.drop_column("summaries", "user_id")
    op.drop_column("summaries", "title")
    op.add_column("quizzes", sa.Column("question", sa.TEXT(), autoincrement=False, nullable=False))
    op.add_column("quizzes", sa.Column("answer", sa.TEXT(), autoincrement=False, nullable=False))
    op.add_column("quizzes", sa.Column("difficulty", sa.VARCHAR(length=20), autoincrement=False, nullable=True))
    op.add_column("quizzes", sa.Column("options", postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.add_column("quizzes", sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True))
    op.drop_constraint(None, "quizzes", schema=schema, type_="foreignkey")
    op.create_foreign_key(op.f("quizzes_document_id_fkey"), "quizzes", "documents", ["document_id"], ["id"], source_schema=schema, referent_schema=schema)
    op.drop_constraint(None, "documents", schema=schema, type_="foreignkey")
    op.create_foreign_key(op.f("documents_user_id_fkey"), "documents", "users", ["user_id"], ["id"], source_schema=schema, referent_schema=schema)
    op.alter_column(
        "documents",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=None,
        existing_nullable=True,
        schema=schema,
    )
