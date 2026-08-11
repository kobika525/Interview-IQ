"""Finalize sandbox PayHere payments and Free/Basic/Pro plans.

Revision ID: i81f5d0e246a
Revises: h70e4c9d135f
"""

from alembic import op
import sqlalchemy as sa

revision = "i81f5d0e246a"
down_revision = "h70e4c9d135f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "mysql":
        op.execute("ALTER TABLE subscription_plans MODIFY code ENUM('FREE','BASIC','PRO','PREMIUM') NOT NULL")
    op.execute("UPDATE subscription_plans SET code='BASIC', name='Basic' WHERE code='PREMIUM'")
    op.rename_table("payment_orders", "payments")
    op.add_column("payments", sa.Column("plan_name", sa.String(60), nullable=True))
    op.add_column("payments", sa.Column("payment_method", sa.String(60), nullable=True))
    op.alter_column("payments", "provider_payment_id", new_column_name="payment_id", existing_type=sa.String(255))
    op.execute(
        "UPDATE payments p JOIN subscription_plans s ON p.plan_id=s.id SET p.plan_name=s.name"
        if bind.dialect.name == "mysql" else
        "UPDATE payments SET plan_name=(SELECT name FROM subscription_plans WHERE id=payments.plan_id)"
    )
    op.alter_column("payments", "plan_name", nullable=False, existing_type=sa.String(60))
    op.drop_column("payments", "provider")


def downgrade() -> None:
    op.add_column("payments", sa.Column("provider", sa.String(20), nullable=False, server_default="payhere"))
    op.alter_column("payments", "payment_id", new_column_name="provider_payment_id", existing_type=sa.String(255))
    op.drop_column("payments", "payment_method")
    op.drop_column("payments", "plan_name")
    op.rename_table("payments", "payment_orders")
    op.execute("UPDATE subscription_plans SET code='PREMIUM', name='Premium' WHERE code='BASIC'")
