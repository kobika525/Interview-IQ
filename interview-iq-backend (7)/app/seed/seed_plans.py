"""Idempotent plan seeding for the Free / Basic / Pro tiers."""

from app.database import SessionLocal
from app.models.subscription import SubscriptionPlan
from app.utils.enums import PlanCode

PLANS = [
    dict(code=PlanCode.FREE, name="Free", price_monthly=0, price_yearly=0,
         resume_scan_limit=3, text_interview_limit=5, voice_interview_limit=3, video_interview_limit=2,
         report_history_limit=1, roadmap_access=True, premium_resources=False),
    dict(code=PlanCode.BASIC, name="Basic", price_monthly=990, price_yearly=9900,
         resume_scan_limit=None, text_interview_limit=None, voice_interview_limit=None, video_interview_limit=None,
         report_history_limit=None, roadmap_access=True, premium_resources=True),
    dict(code=PlanCode.PRO, name="Pro", price_monthly=1990, price_yearly=19900,
         resume_scan_limit=None, text_interview_limit=None, voice_interview_limit=None, video_interview_limit=None,
         report_history_limit=None, roadmap_access=True, premium_resources=True),
]


def run():
    with SessionLocal() as db:
        for plan_data in PLANS:
            existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_data["code"]).first()
            if existing:
                for field, value in plan_data.items():
                    setattr(existing, field, value)
                continue
            db.add(SubscriptionPlan(**plan_data))
        db.commit()
        print(f"[seed_plans] Ensured {len(PLANS)} subscription plans exist.")


if __name__ == "__main__":
    run()
