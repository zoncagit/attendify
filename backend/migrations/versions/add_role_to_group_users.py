"""add role to group_users

Revision ID: manual_add_role_to_group_users
Revises: 
Create Date: 2025-05-26 19:12:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'manual_add_role_to_group_users'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add the role column with a default value of 'member'
    op.add_column('group_users', 
        sa.Column('role', 
                 sa.String(20),
                 nullable=False,
                 server_default='member')
    )

def downgrade():
    # Remove the role column if rolling back
    op.drop_column('group_users', 'role')
