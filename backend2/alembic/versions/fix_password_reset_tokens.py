"""Fix password_reset_tokens schema

Revision ID: fix_password_reset_tokens
Revises: update_password_hash_field
Create Date: 2025-05-25 16:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_password_reset_tokens'
down_revision = 'update_password_hash_field'
branch_labels = None
depends_on = None

def upgrade():
    # Drop the existing table
    op.drop_table('password_reset_tokens')
    
    # Recreate the table with the correct schema
    op.create_table('password_reset_tokens',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(6), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'token')
    )
    
    # Create an index on token for faster lookups
    op.create_index('idx_password_reset_token', 'password_reset_tokens', ['token'])

def downgrade():
    # Drop the table if we need to rollback
    op.drop_table('password_reset_tokens')
    
    # Recreate the old schema (you'll need to adjust this based on your original schema)
    op.create_table('password_reset_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(6), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_password_reset_token', 'password_reset_tokens', ['token'])
