import re
from pathlib import Path

from course_flow.core.discipline_catalogue import DISCIPLINE_CATALOGUE
from course_flow.core.reference_data import (
    ACTIVITY_CONTEXT_OPTIONS,
    ACTIVITY_TASK_OPTIONS,
    COURSE_CONTEXT_OPTIONS,
    TIME_UNIT_OPTIONS,
)
from course_flow.core.system_labels import SYSTEM_CHANNEL_LABEL_CODES
from course_flow.core.system_notifications import SYSTEM_NOTIFICATION_CODES

REFERENCE_CATALOGUE = (
    Path(__file__).parents[2]
    / "react"
    / "src"
    / "i18n"
    / "locales"
    / "en-CA"
    / "reference.ts"
)
WORKFLOW_CATALOGUE = (
    Path(__file__).parents[2]
    / "react"
    / "src"
    / "i18n"
    / "locales"
    / "en-CA"
    / "workflow.ts"
)
NOTIFICATION_CATALOGUE = (
    Path(__file__).parents[2]
    / "react"
    / "src"
    / "i18n"
    / "locales"
    / "en-CA"
    / "notifications.ts"
)


def _translation_keys(group: str) -> set[str]:
    source = REFERENCE_CATALOGUE.read_text()
    match = re.search(rf"  {group}: \{{(.*?)\n  \}},", source, re.DOTALL)
    assert match is not None, f"Missing frontend reference group: {group}"
    return set(re.findall(r"^    ([a-z0-9_]+):", match.group(1), re.MULTILINE))


def test_all_backend_discipline_codes_have_frontend_translations():
    assert _translation_keys("discipline") == set(DISCIPLINE_CATALOGUE)


def test_all_backend_reference_values_have_frontend_translations():
    context_values = {
        value.value for value in (*ACTIVITY_CONTEXT_OPTIONS, *COURSE_CONTEXT_OPTIONS)
    }
    task_values = {value.value for value in ACTIVITY_TASK_OPTIONS}
    time_unit_values = {value.value for value in TIME_UNIT_OPTIONS}

    assert context_values <= _translation_keys("context")
    assert task_values <= _translation_keys("taskClassification")
    assert time_unit_values == _translation_keys("timeUnit")


def test_all_backend_system_channel_codes_have_frontend_translations():
    source = WORKFLOW_CATALOGUE.read_text()
    match = re.search(r"    channel: \{(.*?)\n    \},", source, re.DOTALL)
    assert match is not None, "Missing frontend systemLabels.channel group"
    keys = set(re.findall(r"^      ([a-z0-9_]+):", match.group(1), re.MULTILINE))

    assert keys == set(SYSTEM_CHANNEL_LABEL_CODES)


def test_all_backend_system_notification_codes_have_frontend_translations():
    source = NOTIFICATION_CATALOGUE.read_text()
    match = re.search(r"  messages: \{(.*?)\n  \}", source, re.DOTALL)
    assert match is not None, "Missing frontend notification messages group"
    keys = set(re.findall(r"^    '([^']+)':", match.group(1), re.MULTILINE))

    assert keys == set(SYSTEM_NOTIFICATION_CODES)
