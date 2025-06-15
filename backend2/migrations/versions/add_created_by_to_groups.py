"""add created_by to groups

Revision ID: manual_add_created_by_to_groups
Revises: 
Create Date: 2025-05-26 19:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'manual_add_created_by_to_groups'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add the created_by column
    op.add_column('groups', 
        sa.Column('created_by', 
                 sa.Integer(),
                 sa.ForeignKey('users.user_id'),
                 nullable=False)
    )

def downgrade():
    # Remove the created_by column if rolling back
    op.drop_constraint('groups_ibfk_2', 'groups', type_='foreignkey')
    op.drop_column('groups', 'created_by')
