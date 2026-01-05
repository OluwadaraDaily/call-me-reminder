"""add date_time_utc column to reminders

Revision ID: c669149de5a3
Revises: 4cf363d024d7
Create Date: 2026-01-05 22:25:27.814201

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c669149de5a3'
down_revision: Union[str, None] = '4cf363d024d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add date_time_utc column
    op.add_column('reminders', sa.Column('date_time_utc', sa.DateTime(), nullable=True))

    # Create index for efficient querying
    op.create_index('ix_reminders_date_time_utc_status', 'reminders', ['date_time_utc', 'status'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_reminders_date_time_utc_status', table_name='reminders')

    # Drop column
    op.drop_column('reminders', 'date_time_utc')
