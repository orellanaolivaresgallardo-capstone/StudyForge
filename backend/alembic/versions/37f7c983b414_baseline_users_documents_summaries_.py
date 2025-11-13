"""baseline: create initial documents table"""

from __future__ import annotations

import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import func, text

# revision identifiers, used by Alembic.
revision: str = "37f7c983b414"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _schema() -> str | None:
    value = os.getenv("DATABASE_SCHEMA")
    if value:
        value = value.strip()
    return value or None


def upgrade() -> None:
    schema = _schema()
    if schema:
        op.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        schema=schema,
    )


def downgrade() -> None:
    schema = _schema()
    op.drop_table("documents", schema=schema)
