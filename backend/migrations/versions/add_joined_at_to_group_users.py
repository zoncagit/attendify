"""add joined_at to group_users

Revision ID: manual_add_joined_at_to_group_users
Revises: 
Create Date: 2025-05-26 19:08:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'manual_add_joined_at_to_group_users'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add the joined_at column
    op.add_column('group_users', 
        sa.Column('joined_at', 
                 mysql.TIMESTAMP(),
                 server_default=sa.text('CURRENT_TIMESTAMP'),
                 nullable=True)
    )

def downgrade():
    # Remove the joined_at column if rolling back
    op.drop_column('group_users', 'joined_at')
