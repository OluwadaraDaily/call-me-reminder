"""add scheduler retry and idempotency fields

Revision ID: a1b2c3d4e5f6
Revises: c406fdd3c3dc
Create Date: 2026-01-17 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c406fdd3c3dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add retry tracking fields
    op.add_column('reminders', sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('reminders', sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('reminders', sa.Column('next_retry_at', sa.DateTime(), nullable=True))
    op.add_column('reminders', sa.Column('last_error', sa.Text(), nullable=True))

    # Add idempotency tracking fields
    op.add_column('reminders', sa.Column('idempotency_key', sa.String(length=64), nullable=True))
    op.add_column('reminders', sa.Column('vapi_call_id', sa.String(length=100), nullable=True))

    # Create indexes for efficient querying
    op.create_index('ix_reminders_next_retry_at', 'reminders', ['next_retry_at'])
    op.create_index('ix_reminders_idempotency_key', 'reminders', ['idempotency_key'], unique=True)
    op.create_index('ix_reminders_vapi_call_id', 'reminders', ['vapi_call_id'])
    op.create_index('ix_reminders_status', 'reminders', ['status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_reminders_status', table_name='reminders')
    op.drop_index('ix_reminders_vapi_call_id', table_name='reminders')
    op.drop_index('ix_reminders_idempotency_key', table_name='reminders')
    op.drop_index('ix_reminders_next_retry_at', table_name='reminders')

    # Drop columns
    op.drop_column('reminders', 'vapi_call_id')
    op.drop_column('reminders', 'idempotency_key')
    op.drop_column('reminders', 'last_error')
    op.drop_column('reminders', 'next_retry_at')
    op.drop_column('reminders', 'max_attempts')
    op.drop_column('reminders', 'attempt_count')
