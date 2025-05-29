"""Add face embedding columns to users table

Revision ID: add_face_embedding_columns
Revises: ec775bfeb433
Create Date: 2025-05-26 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_face_embedding_columns'
down_revision = 'ec775bfeb433'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add face embedding columns to users table
    op.add_column('users', sa.Column('face_embedding', sa.Text(), nullable=True, comment='Face embedding vector for recognition'))
    op.add_column('users', sa.Column('face_embedding_updated_at', sa.TIMESTAMP(timezone=True), nullable=True, comment='Last time face embedding was updated'))

def downgrade() -> None:
    # Remove face embedding columns from users table
    op.drop_column('users', 'face_embedding_updated_at')
    op.drop_column('users', 'face_embedding') 