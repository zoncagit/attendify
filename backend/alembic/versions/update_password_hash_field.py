"""update_password_hash_field

Revision ID: update_password_hash_field
Revises: 3e3e6cf50d07
Create Date: 2025-05-25 03:21:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_password_hash_field'
down_revision = '3e3e6cf50d07'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Modify password_hash column to ensure it's large enough for bcrypt hashes
    op.alter_column('users', 'password_hash',
        existing_type=sa.String(255),
        type_=sa.String(512),
        existing_nullable=False)

def downgrade() -> None:
    # Revert password_hash column size
    op.alter_column('users', 'password_hash',
        existing_type=sa.String(512),
        type_=sa.String(255),
        existing_nullable=False)
