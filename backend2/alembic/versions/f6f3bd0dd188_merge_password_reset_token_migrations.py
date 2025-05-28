"""Merge password reset token migrations

Revision ID: f6f3bd0dd188
Revises: ff6eaf77465d, fix_password_reset_tokens
Create Date: 2025-05-25 16:38:01.813674

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6f3bd0dd188'
down_revision: Union[str, None] = ('ff6eaf77465d', 'fix_password_reset_tokens')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
