from collections import defaultdict
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.achievement import Achievement, UserAchievement
from app.models.interview import InterviewSession
from app.models.report import InterviewReport
from app.models.resume import Resume, ResumeAnalysis
from app.models.roadmap import LearningRoadmap
from app.models.skill import SkillGapAnalysis
from app.utils.datetime import strip_tz, utcnow
from app.utils.enums import InterviewStatus

# Centralized, code-driven achievement conditions. `condition_key` matches
# Achievement.condition_key seeded in app/seed/seed_achievements.py.
ACHIEVEMENT_CHECKS = {
    "first_interview": lambda stats: stats["total_interviews"] >= 1,
    "five_interviews": lambda stats: stats["total_interviews"] >= 5,
    "ten_interviews": lambda stats: stats["total_interviews"] >= 10,
    "first_voice_interview": lambda stats: stats["mode_counts"].get("VOICE", 0) >= 1,
    "first_video_interview": lambda stats: stats["mode_counts"].get("VIDEO", 0) >= 1,
    "five_day_streak": lambda stats: stats["current_streak"] >= 5,
    "ats_score_above_80": lambda stats: stats["highest_resume_score"] >= 80,
    "interview_score_above_80": lambda stats: stats["highest_score"] >= 80,
}


class ProgressService:
    def __init__(self, db: Session):
        self.db = db

    def _completed_sessions(self, user_id: int) -> list[InterviewSession]:
        return self.db.scalars(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id, InterviewSession.status == InterviewStatus.COMPLETED)
            .order_by(InterviewSession.completed_at)
        ).all()

    def _reports_for(self, sessions: list[InterviewSession]) -> list[InterviewReport]:
        session_ids = [s.id for s in sessions]
        if not session_ids:
            return []
        return self.db.scalars(
            select(InterviewReport)
            .where(InterviewReport.session_id.in_(session_ids))
            .order_by(InterviewReport.created_at, InterviewReport.id)
        ).all()

    @staticmethod
    def _average(reports: list[InterviewReport], field: str) -> float:
        values = [getattr(report, field) for report in reports if getattr(report, field) is not None]
        return round(sum(values) / len(values), 1) if values else 0.0

    @staticmethod
    def _list_value(value) -> list:
        if isinstance(value, list):
            return value
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    def _current_and_longest_streak(self, sessions: list[InterviewSession]) -> tuple[int, int]:
        dates = sorted({s.completed_at.date() for s in sessions if s.completed_at})
        if not dates:
            return 0, 0
        longest = current = 1
        streaks = [1]
        for i in range(1, len(dates)):
            if (dates[i] - dates[i - 1]).days == 1:
                streaks[-1] += 1
            else:
                streaks.append(1)
        longest = max(streaks)
        current = streaks[-1] if (utcnow().date() - dates[-1]).days <= 1 else 0
        return current, longest

    def _compute_stats(self, user_id: int) -> dict:
        sessions = self._completed_sessions(user_id)
        reports = self._reports_for(sessions)
        scores = [r.overall_score for r in reports]
        mode_counts: dict[str, int] = defaultdict(int)
        for s in sessions:
            mode_counts[s.mode.value] += 1
        current_streak, longest_streak = self._current_and_longest_streak(sessions)

        resume_scores = self.db.scalars(
            select(ResumeAnalysis.overall_score)
            .join(Resume, Resume.id == ResumeAnalysis.resume_id)
            .where(Resume.user_id == user_id)
            .order_by(ResumeAnalysis.created_at)
        ).all()

        return {
            "sessions": sessions, "reports": reports,
            "total_interviews": len(sessions),
            "average_score": round(sum(scores) / len(scores), 1) if scores else 0.0,
            "highest_score": max(scores) if scores else 0.0,
            "mode_counts": dict(mode_counts),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "resume_scores": list(resume_scores),
            "highest_resume_score": max(resume_scores) if resume_scores else 0.0,
        }

    def get_dashboard(self, user_id: int) -> dict:
        stats = self._compute_stats(user_id)

        resume_improvement = 0.0
        if len(stats["resume_scores"]) >= 2:
            resume_improvement = round(stats["resume_scores"][-1] - stats["resume_scores"][0], 1)

        skill_gaps = self.db.scalars(
            select(SkillGapAnalysis).where(SkillGapAnalysis.user_id == user_id).order_by(SkillGapAnalysis.created_at)
        ).all()
        skill_growth = 0.0
        if len(skill_gaps) >= 2:
            skill_growth = round(skill_gaps[-1].readiness_score - skill_gaps[0].readiness_score, 1)
        career_readiness = skill_gaps[-1].readiness_score if skill_gaps else 0.0

        roadmaps = self.db.scalars(select(LearningRoadmap).where(LearningRoadmap.user_id == user_id)).all()
        roadmap_completion = round(sum(r.completion_percentage for r in roadmaps) / len(roadmaps), 1) if roadmaps else 0.0

        score_trend = self._score_trend(stats["reports"])
        weekly_activity = self._activity_buckets(stats["sessions"], days=7)
        monthly_activity = self._activity_buckets(stats["sessions"], days=30, weekly=False)
        mode_distribution = [{"mode": k, "count": v} for k, v in stats["mode_counts"].items()]
        achievements = self._achievements_with_status(user_id, stats)
        phase6 = self._phase6_summary(stats["reports"])

        return {
            "total_interviews": stats["total_interviews"], "average_score": stats["average_score"],
            "highest_score": stats["highest_score"], "current_streak": stats["current_streak"],
            "longest_streak": stats["longest_streak"], "resume_score_improvement": resume_improvement,
            "skill_growth_percentage": skill_growth, "career_readiness": career_readiness,
            "roadmap_completion_percentage": roadmap_completion, "score_trend": score_trend,
            "weekly_activity": weekly_activity, "monthly_activity": monthly_activity,
            "mode_distribution": mode_distribution, "achievements": achievements,
            **phase6,
        }

    def _score_trend(self, reports: list[InterviewReport]) -> list[dict]:
        recent = reports[-8:]
        return [
            {
                "label": f"S{i+1}",
                "overall": r.overall_score,
                "technical": r.technical_score,
                "communication": r.communication_score,
                "grammar": r.grammar_score or 0.0,
                "confidence": r.confidence_score,
            }
            for i, r in enumerate(recent)
        ]

    def _phase6_summary(self, reports: list[InterviewReport]) -> dict:
        skill_fields = [
            ("Technical", "technical_score"),
            ("Communication", "communication_score"),
            ("Grammar", "grammar_score"),
            ("Confidence", "confidence_score"),
            ("Problem solving", "problem_solving_score"),
            ("Relevance", "relevance_score"),
        ]
        latest = reports[-1] if reports else None
        latest_voice = next(
            (report for report in reversed(reports) if report.recording_duration_seconds is not None), None
        )
        latest_video = next(
            (report for report in reversed(reports)
             if report.visual_metrics is not None or report.eye_contact_percentage is not None),
            None,
        )

        voice_metrics = {}
        if latest_voice:
            voice_metrics = {
                "recording_duration_seconds": latest_voice.recording_duration_seconds,
                "wpm": latest_voice.speaking_wpm,
                "speaking_speed": latest_voice.speaking_speed,
                "average_pause_seconds": latest_voice.average_pause_seconds,
                "longest_pause_seconds": latest_voice.longest_pause_seconds,
                "long_pause_count": latest_voice.long_pause_count,
                "filler_count": latest_voice.filler_word_count,
                "confidence": latest_voice.voice_confidence_score,
                "fluency": latest_voice.voice_fluency_score,
                "pronunciation": latest_voice.pronunciation_quality_score,
                "clarity": latest_voice.speech_clarity_score,
            }

        video_metrics = {}
        if latest_video:
            visual = latest_video.visual_metrics or {}
            video_metrics = {
                "eye_contact": latest_video.eye_contact_percentage,
                "visual_presentation": visual.get("visual_presentation_score"),
                "face_visibility": latest_video.face_visibility_percentage,
                "head_stability": visual.get("head_stability_score"),
                "lighting": visual.get("lighting_status"),
                "camera_framing": visual.get("camera_framing_score"),
                "multiple_face_warning": visual.get("multiple_face_warning"),
            }

        return {
            "latest_interview_score": latest.overall_score if latest else 0.0,
            "communication_score": self._average(reports, "communication_score"),
            "grammar_score": self._average(reports, "grammar_score"),
            "confidence_score": self._average(reports, "confidence_score"),
            "eye_contact_score": self._average(reports, "eye_contact_percentage"),
            "body_language_score": self._average(reports, "body_language_confidence_score"),
            "skill_breakdown": [
                {"skill": label, "value": self._average(reports, field)} for label, field in skill_fields
            ] if reports else [],
            "voice_metrics": voice_metrics,
            "video_metrics": video_metrics,
            "ai_feedback": {
                "summary": latest.executive_summary if latest else "",
                "strengths": self._list_value(latest.strengths) if latest else [],
                "improvements": self._list_value(latest.growth_areas) if latest else [],
                "tips": self._list_value(latest.interview_tips) if latest else [],
            },
            "career_suggestions": self._list_value(latest.career_advice) if latest else [],
            "improvement_timeline": self._score_trend(reports),
        }

    def _activity_buckets(self, sessions: list[InterviewSession], days: int, weekly: bool = True) -> list[dict]:
        cutoff = strip_tz(utcnow() - timedelta(days=days))
        recent = [s for s in sessions if s.completed_at and strip_tz(s.completed_at) >= cutoff]
        buckets: dict[str, int] = defaultdict(int)
        for s in recent:
            label = s.completed_at.strftime("%a") if weekly else s.completed_at.strftime("Wk %U")
            buckets[label] += 1
        return [{"label": k, "count": v} for k, v in buckets.items()]

    def _achievements_with_status(self, user_id: int, stats: dict) -> list[dict]:
        all_achievements = self.db.scalars(select(Achievement)).all()
        earned_rows = self.db.scalars(select(UserAchievement).where(UserAchievement.user_id == user_id)).all()
        earned_map = {row.achievement_id: row.earned_at for row in earned_rows}

        result = []
        for achievement in all_achievements:
            already_earned = achievement.id in earned_map
            check = ACHIEVEMENT_CHECKS.get(achievement.condition_key)
            qualifies = check(stats) if check else False

            if qualifies and not already_earned:
                self.db.add(UserAchievement(user_id=user_id, achievement_id=achievement.id))
                self.db.commit()
                already_earned = True
                earned_map[achievement.id] = utcnow()

            result.append({
                "code": achievement.code, "title": achievement.title, "description": achievement.description,
                "icon": achievement.icon, "earned": already_earned,
                "earned_at": earned_map[achievement.id].isoformat() if already_earned else None,
            })
        return result
