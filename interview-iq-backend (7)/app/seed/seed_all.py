"""Run all seed scripts in the correct dependency order. Safe to run repeatedly."""

from app.seed import seed_admin, seed_achievements, seed_plans, seed_questions, seed_resources, seed_roles


def run():
    seed_admin.run()
    seed_plans.run()
    seed_achievements.run()
    seed_roles.run()
    seed_resources.run()
    seed_questions.run()
    print("[seed_all] Done.")


if __name__ == "__main__":
    run()
