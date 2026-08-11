"""Set Free, Basic, and Pro prices in LKR.

Revision ID: j92a6e1f357b
Revises: i81f5d0e246a
"""

from alembic import op

revision = "j92a6e1f357b"
down_revision = "i81f5d0e246a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE subscription_plans SET price_monthly=0, price_yearly=0 WHERE code='FREE'")
    op.execute("UPDATE subscription_plans SET price_monthly=990, price_yearly=9900 WHERE code='BASIC'")
    op.execute("UPDATE subscription_plans SET price_monthly=1990, price_yearly=19900 WHERE code='PRO'")


def downgrade() -> None:
    op.execute("UPDATE subscription_plans SET price_monthly=9, price_yearly=90 WHERE code='BASIC'")
    op.execute("UPDATE subscription_plans SET price_monthly=19, price_yearly=190 WHERE code='PRO'")
