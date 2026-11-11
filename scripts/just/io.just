#########################################################
# PROJECT IMPORT / EXPORT
#########################################################

set working-directory := "../.."

default_project_snapshot := "course_flow/project_snapshots/project_for_templates.v1.json"
default_project_owner_email := "teacher@courseflow.com"

# Import a snapshot into an empty installation while preserving its UUIDs.
[group: 'Project I/O']
import-project snapshot_path=default_project_snapshot owner_email=default_project_owner_email:
  uv run python manage.py cf_import_project_snapshot \
    "{{ snapshot_path }}" \
    --owner-email "{{ owner_email }}"

# Import a snapshot as a new copy with regenerated destination UUIDs.
[group: 'Project I/O']
import-project-copy snapshot_path=default_project_snapshot owner_email=default_project_owner_email:
  uv run python manage.py cf_import_project_snapshot \
    "{{ snapshot_path }}" \
    --owner-email "{{ owner_email }}" \
    --regenerate-identities
