"""Add PayHere payment orders and provider identifiers.

Revision ID: d31a8e907f42
Revises: c92e61f5a704
"""

from alembic import op
import sqlalchemy as sa

revision = "d31a8e907f42"
down_revision = "c92e61f5a704"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_subscriptions", sa.Column("provider_subscription_id", sa.String(255), nullable=True))
    op.add_column("user_subscriptions", sa.Column("provider_order_id", sa.String(100), nullable=True))
    op.create_unique_constraint("uq_user_subscriptions_provider_subscription", "user_subscriptions", ["provider_subscription_id"])
    op.create_unique_constraint("uq_user_subscriptions_provider_order", "user_subscriptions", ["provider_order_id"])
    op.add_column("invoices", sa.Column("provider_payment_id", sa.String(255), nullable=True))
    op.create_unique_constraint("uq_invoices_provider_payment", "invoices", ["provider_payment_id"])
    op.create_table(
        "payment_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.String(100), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(20), nullable=False, server_default="payhere"),
        sa.Column("billing_cycle", sa.String(10), nullable=False),
        sa.Column("amount", sa.Numeric(8, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("provider_payment_id", sa.String(255), nullable=True),
        sa.Column("provider_subscription_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["subscription_plans.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("order_id"),
        sa.UniqueConstraint("provider_payment_id"),
    )
    op.create_index("ix_payment_orders_order_id", "payment_orders", ["order_id"])
    op.create_index("ix_payment_orders_user_id", "payment_orders", ["user_id"])


def downgrade() -> None:
    op.drop_table("payment_orders")
    op.drop_constraint("uq_invoices_provider_payment", "invoices", type_="unique")
    op.drop_column("invoices", "provider_payment_id")
    op.drop_constraint("uq_user_subscriptions_provider_order", "user_subscriptions", type_="unique")
    op.drop_constraint("uq_user_subscriptions_provider_subscription", "user_subscriptions", type_="unique")
    op.drop_column("user_subscriptions", "provider_order_id")
    op.drop_column("user_subscriptions", "provider_subscription_id")
