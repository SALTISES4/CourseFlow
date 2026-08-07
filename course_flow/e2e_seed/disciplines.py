"""Discipline reference data required by the React E2E forms."""

from django.core.management.color import no_style
from django.db import connection

from course_flow.core.models import Discipline

# IDs are part of the current frontend contract: project forms submit these
# values from ``globalContextData.mock.json`` rather than fetching a catalogue.
E2E_DISCIPLINE_CATALOGUE: tuple[tuple[int, str], ...] = (
    (10, "Anthropology"),
    (3, "Biology"),
    (27, "Business"),
    (2, "Chemistry"),
    (8, "Computer Science"),
    (31, "Design"),
    (11, "Economics"),
    (9, "Engineering"),
    (28, "English"),
    (4, "Environmental Science"),
    (29, "French"),
    (12, "Geography"),
    (20, "History"),
    (24, "Humanities (General)"),
    (30, "Languages"),
    (22, "Law"),
    (21, "Literature"),
    (6, "Mathematics"),
    (25, "Medicine"),
    (26, "Nursing"),
    (32, "Other"),
    (18, "Performing Arts"),
    (7, "Philosophy"),
    (1, "Physics"),
    (13, "Political Science"),
    (14, "Psychology"),
    (5, "Science (General)"),
    (17, "Social Sciences (General)"),
    (16, "Social Work"),
    (15, "Sociology"),
    (23, "Theology"),
    (19, "Visual Arts"),
)


def ensure_e2e_disciplines() -> None:
    """Synchronize the fixed-ID catalogue and leave future PK allocation safe."""
    for discipline_id, label in E2E_DISCIPLINE_CATALOGUE:
        Discipline.objects.update_or_create(
            id=discipline_id,
            defaults={"label": label},
        )

    sequence_sql = connection.ops.sequence_reset_sql(no_style(), [Discipline])
    with connection.cursor() as cursor:
        for statement in sequence_sql:
            cursor.execute(statement)
