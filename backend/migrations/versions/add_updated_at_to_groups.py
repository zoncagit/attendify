"""add updated_at to groups

Revision ID: manual_add_updated_at_to_groups
Revises: 
Create Date: 2025-05-26 17:59:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'manual_add_updated_at_to_groups'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add the updated_at column as nullable first
    op.add_column('groups', 
        sa.Column('updated_at', 
                 sa.TIMESTAMP(timezone=True), 
                 server_default=sa.func.now(),
                 onupdate=sa.func.now(),
                 nullable=True)
    )

def downgrade():
    # Remove the updated_at column if rolling back
    op.drop_column('groups', 'updated_at')
