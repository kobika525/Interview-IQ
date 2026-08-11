"""Add Stripe payment identifiers.

Revision ID: c92e61f5a704
Revises: b17c4d9a2e31
"""

from alembic import op
import sqlalchemy as sa


revision = "c92e61f5a704"
down_revision = "b17c4d9a2e31"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    def column_names(table_name: str) -> set[str]:
        return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}

    def unique_constraint_names(table_name: str) -> set[str]:
        return {
            constraint["name"]
            for constraint in sa.inspect(bind).get_unique_constraints(table_name)
            if constraint.get("name")
        }

    subscription_column_info = {
        column["name"]: column for column in sa.inspect(bind).get_columns("user_subscriptions")
    }
    subscription_columns = set(subscription_column_info)
    if "payment_provider" not in subscription_columns:
        op.add_column(
            "user_subscriptions",
            sa.Column("payment_provider", sa.String(20), nullable=False, server_default="demo"),
        )
    elif subscription_column_info["payment_provider"].get("nullable", True):
        op.execute(
            sa.text(
                "UPDATE user_subscriptions "
                "SET payment_provider = 'demo' "
                "WHERE payment_provider IS NULL"
            )
        )
        op.alter_column(
            "user_subscriptions",
            "payment_provider",
            existing_type=sa.String(20),
            nullable=False,
        )
    if "stripe_customer_id" not in subscription_columns:
        op.add_column("user_subscriptions", sa.Column("stripe_customer_id", sa.String(255), nullable=True))
    if "stripe_subscription_id" not in subscription_columns:
        op.add_column("user_subscriptions", sa.Column("stripe_subscription_id", sa.String(255), nullable=True))
    if "stripe_checkout_session_id" not in subscription_columns:
        op.add_column("user_subscriptions", sa.Column("stripe_checkout_session_id", sa.String(255), nullable=True))

    subscription_constraints = unique_constraint_names("user_subscriptions")
    if "uq_user_subscriptions_stripe_subscription" not in subscription_constraints:
        op.create_unique_constraint(
            "uq_user_subscriptions_stripe_subscription",
            "user_subscriptions",
            ["stripe_subscription_id"],
        )
    if "uq_user_subscriptions_stripe_checkout" not in subscription_constraints:
        op.create_unique_constraint(
            "uq_user_subscriptions_stripe_checkout",
            "user_subscriptions",
            ["stripe_checkout_session_id"],
        )

    if "stripe_event_id" not in column_names("invoices"):
        op.add_column("invoices", sa.Column("stripe_event_id", sa.String(255), nullable=True))
    if "uq_invoices_stripe_event" not in unique_constraint_names("invoices"):
        op.create_unique_constraint("uq_invoices_stripe_event", "invoices", ["stripe_event_id"])


def downgrade() -> None:
    bind = op.get_bind()

    def column_names(table_name: str) -> set[str]:
        return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}

    def unique_constraint_names(table_name: str) -> set[str]:
        return {
            constraint["name"]
            for constraint in sa.inspect(bind).get_unique_constraints(table_name)
            if constraint.get("name")
        }

    if "uq_invoices_stripe_event" in unique_constraint_names("invoices"):
        op.drop_constraint("uq_invoices_stripe_event", "invoices", type_="unique")
    if "stripe_event_id" in column_names("invoices"):
        op.drop_column("invoices", "stripe_event_id")

    subscription_constraints = unique_constraint_names("user_subscriptions")
    if "uq_user_subscriptions_stripe_checkout" in subscription_constraints:
        op.drop_constraint("uq_user_subscriptions_stripe_checkout", "user_subscriptions", type_="unique")
    if "uq_user_subscriptions_stripe_subscription" in subscription_constraints:
        op.drop_constraint("uq_user_subscriptions_stripe_subscription", "user_subscriptions", type_="unique")

    subscription_columns = column_names("user_subscriptions")
    for column_name in (
        "stripe_checkout_session_id",
        "stripe_subscription_id",
        "stripe_customer_id",
        "payment_provider",
    ):
        if column_name in subscription_columns:
            op.drop_column("user_subscriptions", column_name)
