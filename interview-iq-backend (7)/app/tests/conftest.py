import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app


@pytest.fixture(autouse=True)
def mock_gemini_interview_evaluation(monkeypatch):
    """Keep API tests deterministic and prevent paid external calls."""
    def fake_evaluate_answer(**_kwargs):
        return {
            "overall_score": 78.0, "technical_accuracy": 80.0, "communication": 76.0,
            "confidence": 74.0, "grammar": 82.0, "fluency": 75.0, "relevance": 81.0,
            "problem_solving": 77.0, "strengths": ["Explains the approach clearly."],
            "weaknesses": ["Could quantify the expected impact."],
            "improved_answer": "I would clarify the requirements, design the API, and validate the trade-offs with measurable tests.",
            "interview_tips": ["State assumptions before choosing the design."],
            "career_advice": ["Practice system-design trade-off discussions."],
            "suggested_learning_resources": ["Official REST API design documentation"],
            "follow_up_question": "How would you secure and monitor this API?",
            "relevance_score": 81.0, "technical_score": 80.0, "communication_score": 76.0,
            "structure_score": 82.0, "star_score": None, "keyword_coverage": 0.0,
            "matched_keywords": [], "missing_keywords": [], "confidence_score": 74.0,
            "professionalism_score": 79.0, "overall_answer_score": 78.0,
            "feedback": "Explains the approach clearly. Could quantify the expected impact.",
            "model_answer": "I would clarify the requirements, design the API, and validate the trade-offs with measurable tests.",
            "improvement_suggestion": "State assumptions before choosing the design.",
            "evaluation_provider": "gemini",
        }

    monkeypatch.setattr("app.services.interview_service.evaluate_answer", fake_evaluate_answer)
    monkeypatch.setattr(
        "app.services.career_service.enrich_recommendations",
        lambda base, _context: base,
    )


TEST_DB_URL = settings.TEST_DATABASE_URL or settings.DATABASE_URL.replace("interview_iq", "interview_iq_test")

engine = create_engine(TEST_DB_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    import app.models  # noqa: F401 ensure all models are registered
    from app.core.security import hash_password
    from app.models.profile import UserProfile
    from app.models.user import User
    from app.utils.enums import AccountStatus, UserRole

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Seed a deterministic admin account for admin-route tests (independent of
    # the dev-DB seed scripts, since this is a separate test database).
    with TestingSessionLocal(bind=engine.connect()) as session:
        admin = User(
            full_name="Test Admin", email="admin@interviewiq.com",
            password_hash=hash_password("ChangeMe123!"),
            role=UserRole.ADMIN, account_status=AccountStatus.ACTIVE, email_verified=True,
        )
        session.add(admin)
        session.flush()
        session.add(UserProfile(user_id=admin.id))

        # Minimal fixture data so career/roadmap/resource/subscription tests
        # have something real to work against.
        from app.models.career import CareerRole
        from app.models.interview import InterviewQuestion
        from app.models.resource import LearningResource
        from app.models.skill import RoleSkill, Skill
        from app.models.subscription import SubscriptionPlan
        from app.utils.enums import Difficulty, ExperienceLevel, InterviewType, PlanCode, QuestionSource, ResourceType, SkillCategory

        for code, name, monthly, yearly, video_limit in [
            (PlanCode.FREE, "Free", 0, 0, 2),
            (PlanCode.BASIC, "Basic", 990, 9900, None),
            (PlanCode.PRO, "Pro", 1990, 19900, None),
        ]:
            session.add(SubscriptionPlan(
                code=code, name=name, price_monthly=monthly, price_yearly=yearly,
                resume_scan_limit=3 if code == PlanCode.FREE else None, text_interview_limit=5 if code == PlanCode.FREE else None,
                voice_interview_limit=3 if code == PlanCode.FREE else None, video_interview_limit=video_limit,
                report_history_limit=1 if code == PlanCode.FREE else None, roadmap_access=True,
                premium_resources=code != PlanCode.FREE,
            ))

        python_skill = Skill(name="Python", category=SkillCategory.TECHNICAL)
        sql_skill = Skill(name="SQL", category=SkillCategory.TECHNICAL)
        session.add_all([python_skill, sql_skill])
        session.flush()

        role = CareerRole(
            title="Backend Developer", slug="backend-developer", description="Builds backend services.",
            experience_level=ExperienceLevel.INTERMEDIATE, demand_level="High",
            estimated_learning_duration_weeks=8,
        )
        session.add(role)
        session.flush()
        session.add(RoleSkill(career_role_id=role.id, skill_id=python_skill.id, is_required=True))
        session.add(RoleSkill(career_role_id=role.id, skill_id=sql_skill.id, is_required=True))

        session.add(LearningResource(
            title="Intro to Backend Development", skill_id=python_skill.id, resource_type=ResourceType.COURSE,
            difficulty=Difficulty.BEGINNER, provider="Test Provider", estimated_duration_minutes=60, is_premium=False,
        ))

        session.add(InterviewQuestion(
            question_text="Explain how you would design a REST API for a to-do list app.",
            topic="API Design", category="Backend", difficulty=Difficulty.BEGINNER, interview_type=InterviewType.TECHNICAL,
            expected_keywords=["rest", "endpoint", "crud"], expected_key_points=["Mentions CRUD operations"],
            source=QuestionSource.ADMIN,
        ))
        session.add(InterviewQuestion(
            question_text="Tell me about a challenge you faced in a group project.",
            topic="Teamwork", category="Behavioral", difficulty=Difficulty.BEGINNER, interview_type=InterviewType.HR,
            expected_keywords=["team", "communication"], expected_key_points=["Describes a specific situation"],
            source=QuestionSource.ADMIN,
        ))

        session.commit()

    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """Wraps each test in an outer transaction + a SAVEPOINT that's restarted
    after every commit, so that service-layer `db.commit()` calls (used
    throughout app/services/*) don't leak data between tests."""
    from sqlalchemy import event

    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def register_and_login(client):
    def _do(email="pytestuser@example.com", password="TestPass123!"):
        client.post("/api/auth/register", json={
            "full_name": "Pytest User", "email": email, "password": password, "confirm_password": password,
        })
        response = client.post("/api/auth/login", json={"email": email, "password": password})
        token = response.json()["data"]["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _do
