"""normalize payment order index to match SQLAlchemy metadata

Revision ID: d25fa79e4c18
Revises: c14d82fa310b
Create Date: 2026-08-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d25fa79e4c18"
down_revision: Union[str, None] = "c14d82fa310b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes("payment_orders")}
    for name in ("order_id", "ix_payment_orders_order_id"):
        if name in indexes:
            op.drop_index(name, table_name="payment_orders")
    op.create_index("ix_payment_orders_order_id", "payment_orders", ["order_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_payment_orders_order_id", table_name="payment_orders")
    op.create_unique_constraint("order_id", "payment_orders", ["order_id"])
    op.create_index("ix_payment_orders_order_id", "payment_orders", ["order_id"], unique=False)
