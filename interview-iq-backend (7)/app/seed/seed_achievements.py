from app.database import SessionLocal
from app.models.achievement import Achievement

ACHIEVEMENTS = [
    dict(code="first_interview", title="First Interview", description="Completed your first mock interview.", icon="mic", condition_key="first_interview", condition_value=1),
    dict(code="five_interviews", title="Five Interviews", description="Completed 5 mock interviews.", icon="mic", condition_key="five_interviews", condition_value=5),
    dict(code="ten_interviews", title="Ten Interviews", description="Completed 10 mock interviews.", icon="award", condition_key="ten_interviews", condition_value=10),
    dict(code="first_voice_interview", title="First Voice Interview", description="Completed your first voice interview.", icon="mic-2", condition_key="first_voice_interview", condition_value=1),
    dict(code="first_video_interview", title="First Video Interview", description="Completed your first video interview.", icon="video", condition_key="first_video_interview", condition_value=1),
    dict(code="five_day_streak", title="Five-Day Streak", description="Practised 5 days in a row.", icon="flame", condition_key="five_day_streak", condition_value=5),
    dict(code="ats_score_above_80", title="ATS Score Above 80", description="Scored above 80 on a resume analysis.", icon="file-check", condition_key="ats_score_above_80", condition_value=80),
    dict(code="interview_score_above_80", title="Interview Score Above 80", description="Scored above 80 in a mock interview.", icon="trophy", condition_key="interview_score_above_80", condition_value=80),
]


def run():
    with SessionLocal() as db:
        created = 0
        for data in ACHIEVEMENTS:
            if db.query(Achievement).filter(Achievement.code == data["code"]).first():
                continue
            db.add(Achievement(**data))
            created += 1
        db.commit()
        print(f"[seed_achievements] Created {created} new achievements (of {len(ACHIEVEMENTS)} total).")


if __name__ == "__main__":
    run()
