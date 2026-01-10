"""Add role to class_users table

Revision ID: ec775bfeb433
Revises: f6f3bd0dd188
Create Date: 2025-05-26 02:28:48.916587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec775bfeb433'
down_revision: Union[str, None] = 'f6f3bd0dd188'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
