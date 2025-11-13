"""create missing tables (users/summaries/quizzes)"""

from __future__ import annotations

import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "458a31d5300e"
down_revision: Union[str, Sequence[str], None] = "37f7c983b414"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _schema() -> str | None:
    value = os.getenv("DATABASE_SCHEMA")
    if value:
        value = value.strip()
    return value or None


def _index(name: str, schema: str | None) -> str:
    return f"ix_{schema}_{name}" if schema else f"ix_{name}"


def _fk(table: str, column: str = "id", schema: str | None = None) -> str:
    if schema:
        return f"{schema}.{table}.{column}"
    return f"{table}.{column}"


def upgrade() -> None:
    schema = _schema()

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.Column("password_hash", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema=schema,
    )
    op.create_index(
        _index("users_email", schema),
        "users",
        ["email"],
        unique=True,
        schema=schema,
    )
    op.create_index(
        _index("users_id", schema),
        "users",
        ["id"],
        unique=False,
        schema=schema,
    )

    # quizzes
    op.create_table(
        "quizzes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=True),
        sa.Column("difficulty", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], [_fk("documents", schema=schema)]),
        sa.PrimaryKeyConstraint("id"),
        schema=schema,
    )

    # summaries
    op.create_table(
        "summaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], [_fk("documents", schema=schema)]),
        sa.PrimaryKeyConstraint("id"),
        schema=schema,
    )

    # documents adjustments
    op.add_column(
        "documents",
        sa.Column("user_id", sa.Integer(), nullable=True),
        schema=schema,
    )
    op.add_column(
        "documents",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        schema=schema,
    )
    op.alter_column(
        "documents",
        "title",
        existing_type=sa.VARCHAR(length=255),
        type_=sa.String(length=200),
        existing_nullable=False,
        schema=schema,
    )
    op.alter_column(
        "documents",
        "description",
        existing_type=sa.VARCHAR(length=500),
        type_=sa.String(length=300),
        existing_nullable=True,
        schema=schema,
    )
    op.alter_column(
        "documents",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=None,
        nullable=True,
        schema=schema,
    )
    op.create_index(
        _index("documents_id", schema),
        "documents",
        ["id"],
        unique=False,
        schema=schema,
    )
    op.create_foreign_key(
        None,
        "documents",
        "users",
        ["user_id"],
        ["id"],
        source_schema=schema,
        referent_schema=schema,
    )


def downgrade() -> None:
    schema = _schema()

    op.drop_constraint(None, "documents", schema=schema, type_="foreignkey")
    op.drop_index(_index("documents_id", schema), table_name="documents", schema=schema)

    op.alter_column(
        "documents",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
        schema=schema,
    )
    op.alter_column(
        "documents",
        "description",
        existing_type=sa.String(length=300),
        type_=sa.VARCHAR(length=500),
        existing_nullable=True,
        schema=schema,
    )
    op.alter_column(
        "documents",
        "title",
        existing_type=sa.String(length=200),
        type_=sa.VARCHAR(length=255),
        existing_nullable=False,
        schema=schema,
    )
    op.drop_column("documents", "updated_at", schema=schema)
    op.drop_column("documents", "user_id", schema=schema)

    op.drop_table("summaries", schema=schema)
    op.drop_table("quizzes", schema=schema)
    op.drop_index(_index("users_id", schema), table_name="users", schema=schema)
    op.drop_index(_index("users_email", schema), table_name="users", schema=schema)
    op.drop_table("users", schema=schema)
