from fastapi import APIRouter

from app.api.routes import (
    achievements, admin_analytics, admin_questions, admin_reports, admin_resources, admin_roles,
    admin_settings, admin_subscriptions, admin_users, auth, billing, careers, interviews, jobs,
    notifications, progress, reports, resources, resumes, roadmaps, skills, subscriptions, support,
    users,
)

api_router = APIRouter()

for module in (
    auth, users, resumes, careers, skills, roadmaps, resources, interviews, reports, progress,
    achievements, notifications, subscriptions, billing, support, jobs,
    admin_users, admin_questions, admin_roles, admin_resources, admin_subscriptions, admin_reports,
    admin_analytics, admin_settings,
):
    api_router.include_router(module.router)
