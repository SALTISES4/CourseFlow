"""Naming and bounds for dev seed data (not a generic fixture dump).

For Playwright E2E contract data see ``course_flow.e2e_seed``.
"""

# Projects created by the generator use this title prefix so `--clear` can
# remove them without touching unrelated rows. Documented contract for local dev.
DEV_SEED_PROJECT_TITLE_PREFIX = "DEV SEED -"

# Tag labels created for seed projects use this prefix (tags may become orphan
# on project delete via SET_NULL; we delete project-owned tags before delete).
DEV_SEED_TAG_LABEL_PREFIX = "DEV SEED TAG -"

# Admin is created separately (e.g. `just django-create-superuser`); seed only references it.
DEV_SEED_ADMIN_EMAIL = "admin@courseflow.com"
DEV_SEED_TEACHER_EMAIL = "teacher@courseflow.com"
DEV_SEED_STUDENT_EMAIL = "student@courseflow.com"
DEV_SEED_DEMO_PASSWORD = "password"
