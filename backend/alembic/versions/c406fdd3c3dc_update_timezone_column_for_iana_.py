"""update_timezone_column_for_iana_timezones

Revision ID: c406fdd3c3dc
Revises: 201453e920f3
Create Date: 2026-01-13 20:25:26.953778

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c406fdd3c3dc'
down_revision: Union[str, None] = '201453e920f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite doesn't support ALTER COLUMN for type changes, so we use batch mode
    # This recreates the table with the new column definition
    with op.batch_alter_table('reminders', schema=None) as batch_op:
        batch_op.alter_column('timezone',
                              existing_type=sa.String(length=10),
                              type_=sa.String(length=100),
                              existing_nullable=False)


def downgrade() -> None:
    # Revert timezone column size back to String(10)
    # Note: This may fail if existing data contains IANA timezone identifiers longer than 10 characters
    with op.batch_alter_table('reminders', schema=None) as batch_op:
        batch_op.alter_column('timezone',
                              existing_type=sa.String(length=100),
                              type_=sa.String(length=10),
                              existing_nullable=False)
