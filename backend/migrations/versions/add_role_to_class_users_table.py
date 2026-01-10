"""Add role to class_users table

Revision ID: ec775bfeb433
Revises: 
Create Date: 2025-05-26 02:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ec775bfeb433'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add role column to class_users table
    op.add_column('class_users', sa.Column('role', sa.String(20), nullable=False, server_default='member'))


def downgrade():
    # Remove role column from class_users table
    op.drop_column('class_users', 'role')
