"""Seeds a starter question bank covering technical, HR/behavioural, and
mixed types across common topics — the reliable fallback source the spec
requires even when Ollama/local LLM generation is unavailable."""

from app.database import SessionLocal
from app.models.interview import InterviewQuestion
from app.utils.enums import Difficulty, InterviewType, QuestionSource

QUESTIONS = [
    dict(question_text="Explain the difference between controlled and uncontrolled components in React.",
         topic="React", category="Frontend", difficulty=Difficulty.INTERMEDIATE, interview_type=InterviewType.TECHNICAL,
         expected_keywords=["state", "value", "onChange", "ref", "DOM"],
         expected_key_points=["Mentions React state", "Mentions onChange handler", "Contrasts with DOM-managed state"],
         sample_answer="A controlled component derives its value from React state and updates via an onChange handler. An uncontrolled component manages its own state internally in the DOM and is accessed via a ref."),
    dict(question_text="Walk me through how you would design a rate limiter for a public API.",
         topic="System Design", category="Backend", difficulty=Difficulty.ADVANCED, interview_type=InterviewType.TECHNICAL,
         expected_keywords=["token bucket", "sliding window", "redis", "distributed", "throttling"],
         expected_key_points=["Names an algorithm (token bucket/sliding window)", "Addresses distributed enforcement", "Mentions response behaviour (429)"],
         sample_answer="A rate limiter can use a token bucket or sliding-window algorithm backed by a shared store like Redis so limits stay consistent across distributed servers, returning 429 with retry-after headers when exceeded."),
    dict(question_text="Tell me about a time you disagreed with a teammate. How did you handle it?",
         topic="Behavioral", category="Teamwork", difficulty=Difficulty.BEGINNER, interview_type=InterviewType.HR,
         expected_keywords=["communication", "compromise", "listened", "resolution"],
         expected_key_points=["Describes a specific situation", "Explains the action taken", "States the outcome"],
         sample_answer="Describe the disagreement, how you listened to the other perspective, the compromise reached, and what you learned about communicating under disagreement."),
    dict(question_text="What is database indexing and when would you avoid adding one?",
         topic="Databases", category="Backend", difficulty=Difficulty.INTERMEDIATE, interview_type=InterviewType.TECHNICAL,
         expected_keywords=["b-tree", "query performance", "write overhead", "storage"],
         expected_key_points=["Explains what an index does", "Mentions write overhead trade-off", "Gives an example of when to avoid one"],
         sample_answer="Indexes speed up reads by avoiding full table scans, typically via B-tree structures, but add write overhead and storage cost — best avoided on low-cardinality columns or heavy-write tables."),
    dict(question_text="A production deployment just broke a critical feature. What do you do first?",
         topic="Situational", category="Incident Response", difficulty=Difficulty.INTERMEDIATE, interview_type=InterviewType.BEHAVIORAL,
         expected_keywords=["rollback", "monitoring", "communicate", "root cause"],
         expected_key_points=["Prioritises stabilising the system", "Mentions communication to stakeholders", "Mentions root-cause investigation after stabilising"],
         sample_answer="Stabilise first via rollback or feature-flag disable, communicate status to stakeholders, then investigate logs/monitoring to find the root cause before redeploying with a fix."),
    dict(question_text="What is the difference between == and === in JavaScript?",
         topic="JavaScript", category="Frontend", difficulty=Difficulty.BEGINNER, interview_type=InterviewType.TECHNICAL,
         expected_keywords=["type coercion", "strict equality", "loose equality"],
         expected_key_points=["Explains type coercion", "States === avoids coercion"],
         sample_answer="== performs type coercion before comparing values, while === compares both value and type without coercion, which is why strict equality is generally preferred."),
    dict(question_text="Describe your ideal team culture and why it matters to you.",
         topic="Culture Fit", category="HR", difficulty=Difficulty.BEGINNER, interview_type=InterviewType.HR,
         expected_keywords=["collaboration", "communication", "trust", "feedback"],
         expected_key_points=["Describes specific values", "Connects values to past experience"],
         sample_answer="A strong team culture is built on open communication, psychological safety, and regular feedback — I've seen this directly improve delivery speed and morale on past teams."),
    dict(question_text="How would you test and validate a new caching layer before deploying it to production?",
         topic="Testing", category="Backend", difficulty=Difficulty.INTERMEDIATE, interview_type=InterviewType.TECHNICAL,
         expected_keywords=["cache invalidation", "load testing", "staging", "monitoring"],
         expected_key_points=["Mentions staged rollout", "Mentions cache invalidation edge cases", "Mentions monitoring after deploy"],
         sample_answer="I'd test cache invalidation logic thoroughly, load-test in staging, roll out gradually behind a feature flag, and closely monitor hit rates and error rates post-deploy."),
]


def run():
    with SessionLocal() as db:
        created = 0
        for q in QUESTIONS:
            if db.query(InterviewQuestion).filter(InterviewQuestion.question_text == q["question_text"]).first():
                continue
            db.add(InterviewQuestion(**q, source=QuestionSource.ADMIN))
            created += 1
        db.commit()
        print(f"[seed_questions] Created {created} new questions (of {len(QUESTIONS)} total).")


if __name__ == "__main__":
    run()
