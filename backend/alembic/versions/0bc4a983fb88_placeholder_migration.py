"""placeholder_migration

Revision ID: 0bc4a983fb88
Revises: fbdf6cca3f23
Create Date: 2025-11-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0bc4a983fb88'
down_revision: Union[str, Sequence[str], None] = 'fbdf6cca3f23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Placeholder - no changes
    pass


def downgrade() -> None:
    # Placeholder - no changes
    pass
