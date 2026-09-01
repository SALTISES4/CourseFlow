from django.db import migrations, models
from django.utils.text import slugify

DISCIPLINES = (
    ("anthropology", "Anthropology"),
    ("biology", "Biology"),
    ("business", "Business"),
    ("chemistry", "Chemistry"),
    ("computer_science", "Computer Science"),
    ("design", "Design"),
    ("economics", "Economics"),
    ("engineering", "Engineering"),
    ("english", "English"),
    ("environmental_science", "Environmental Science"),
    ("french", "French"),
    ("geography", "Geography"),
    ("history", "History"),
    ("humanities_general", "Humanities (General)"),
    ("languages", "Languages"),
    ("law", "Law"),
    ("literature", "Literature"),
    ("mathematics", "Mathematics"),
    ("medicine", "Medicine"),
    ("nursing", "Nursing"),
    ("other", "Other"),
    ("performing_arts", "Performing Arts"),
    ("philosophy", "Philosophy"),
    ("physics", "Physics"),
    ("political_science", "Political Science"),
    ("psychology", "Psychology"),
    ("science_general", "Science (General)"),
    ("social_sciences_general", "Social Sciences (General)"),
    ("social_work", "Social Work"),
    ("sociology", "Sociology"),
    ("theology", "Theology"),
    ("visual_arts", "Visual Arts"),
)


def populate_discipline_catalogue(apps, schema_editor):
    Discipline = apps.get_model("cf_core", "Discipline")
    assigned_codes: set[str] = set()

    for code, label in DISCIPLINES:
        rows = list(Discipline.objects.filter(label=label).order_by("id"))
        discipline = rows[0] if rows else Discipline.objects.create(label=label)
        discipline.code = code
        discipline.save(update_fields=["code"])
        assigned_codes.add(code)

    for discipline in Discipline.objects.filter(code__isnull=True).order_by("id"):
        base = (
            slugify(discipline.label).replace("-", "_")[:64]
            or f"discipline_{discipline.id}"
        )
        code = base
        suffix_index = 0
        while code in assigned_codes:
            suffix = f"_{discipline.id}"
            if suffix_index:
                suffix += f"_{suffix_index}"
            code = f"{base[: 64 - len(suffix)]}{suffix}"
            suffix_index += 1
        discipline.code = code
        discipline.save(update_fields=["code"])
        assigned_codes.add(code)


class Migration(migrations.Migration):
    dependencies = [("cf_core", "0016_taskmeta_task_classification")]

    operations = [
        migrations.AddField(
            model_name="discipline",
            name="code",
            field=models.CharField(max_length=64, null=True),
        ),
        migrations.RunPython(populate_discipline_catalogue, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="discipline",
            name="code",
            field=models.SlugField(max_length=64, unique=True),
        ),
    ]
