"""Naming and bounds for dev seed data (not a generic fixture dump)."""

# Projects created by the generator use this title prefix so `--clear` can
# remove them without touching unrelated rows. Documented contract for local dev.
DEV_SEED_PROJECT_TITLE_PREFIX = "DEV SEED -"

# Tag labels created for seed projects use this prefix (tags may become orphan
# on project delete via SET_NULL; we delete project-owned tags before delete).
DEV_SEED_TAG_LABEL_PREFIX = "DEV SEED TAG -"
