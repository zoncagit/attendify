"""add_password_reset_tokens_table

Revision ID: 3e3e6cf50d07
Revises: 
Create Date: 2025-05-18 20:10:10.868763

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '3e3e6cf50d07'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create password reset tokens table
    op.create_table('password_reset_tokens',
        sa.Column('token_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('token_id'),
        sa.UniqueConstraint('token')
    )
    # Create indexes
    op.create_index(op.f('ix_password_reset_tokens_token_id'), 'password_reset_tokens', ['token_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop password reset tokens table
    op.drop_index(op.f('ix_password_reset_tokens_token_id'), table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')
    op.create_index('ix_classes_class_id', 'classes', ['class_id'], unique=False)
    op.create_index('class_code', 'classes', ['class_code'], unique=True)
    op.create_table('sessions',
    sa.Column('session_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('class_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('session_topic', mysql.VARCHAR(length=255), nullable=True),
    sa.Column('session_date', sa.DATE(), nullable=False),
    sa.Column('start_time', mysql.TIME(), nullable=True),
    sa.Column('end_time', mysql.TIME(), nullable=True),
    sa.Column('created_by', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('qr_code', mysql.TEXT(), nullable=True),
    sa.Column('qr_last_updated_at', mysql.TIMESTAMP(), nullable=True),
    sa.Column('created_at', mysql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
    sa.Column('updated_at', mysql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
    sa.ForeignKeyConstraint(['class_id'], ['classes.class_id'], name='sessions_ibfk_1'),
    sa.ForeignKeyConstraint(['created_by'], ['users.user_id'], name='sessions_ibfk_2'),
    sa.PrimaryKeyConstraint('session_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('logs',
    sa.Column('log_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('action_type', mysql.VARCHAR(length=50), nullable=False),
    sa.Column('description', mysql.TEXT(), nullable=True),
    sa.Column('timestamp', mysql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='logs_ibfk_1'),
    sa.PrimaryKeyConstraint('log_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('attendance',
    sa.Column('session_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('user_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('marked_at', mysql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
    sa.Column('status', mysql.ENUM('present', 'absent'), nullable=False),
    sa.ForeignKeyConstraint(['session_id'], ['sessions.session_id'], name='attendance_ibfk_1'),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='attendance_ibfk_2'),
    sa.PrimaryKeyConstraint('session_id', 'user_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('class_users',
    sa.Column('class_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('user_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('joined_at', mysql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
    sa.ForeignKeyConstraint(['class_id'], ['classes.class_id'], name='class_users_ibfk_1'),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='class_users_ibfk_2'),
    sa.PrimaryKeyConstraint('class_id', 'user_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('users',
    sa.Column('user_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('full_name', mysql.VARCHAR(length=100), nullable=False, comment="Nom complet de l'utilisateur"),
    sa.Column('email', mysql.VARCHAR(length=100), nullable=False, comment="Adresse email unique de l'utilisateur"),
    sa.Column('password_hash', mysql.VARCHAR(length=255), nullable=False, comment='Mot de passe haché avec bcrypt'),
    sa.Column('face_id_hash', mysql.TEXT(), nullable=True, comment='Hachage des données biométriques du visage'),
    sa.Column('face_id_vector', mysql.TEXT(), nullable=True, comment="Vecteur d'encodage des caractéristiques du visage"),
    sa.Column('face_id_encrypted', mysql.TINYINT(display_width=1), autoincrement=False, nullable=True, comment='Indique si les données biométriques sont chiffrées'),
    sa.Column('created_at', mysql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True, comment='Date et heure de création du compte'),
    sa.Column('updated_at', mysql.TIMESTAMP(), nullable=True, comment='Date et heure de la dernière mise à jour'),
    sa.Column('is_active', mysql.TINYINT(display_width=1), autoincrement=False, nullable=True, comment='Indique si le compte est actif'),
    sa.Column('is_superuser', mysql.TINYINT(display_width=1), autoincrement=False, nullable=True, comment="Indique si l'utilisateur est un administrateur"),
    sa.PrimaryKeyConstraint('user_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_users_user_id', 'users', ['user_id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    # ### end Alembic commands ###
