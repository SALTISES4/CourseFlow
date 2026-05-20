from django.db import migrations, models


def backfill_empty_edge_ports(apps, schema_editor):
    Edge = apps.get_model("cf_core", "Edge")
    # Canonical default handle: east/right (index 1) when legacy rows omitted ports.
    Edge.objects.filter(source_port="").update(source_port="1")
    Edge.objects.filter(target_port="").update(target_port="1")


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0006_edge_title_and_text_position"),
    ]

    operations = [
        migrations.RunPython(backfill_empty_edge_ports, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="edge",
            name="source_port",
            field=models.CharField(max_length=64),
        ),
        migrations.AlterField(
            model_name="edge",
            name="target_port",
            field=models.CharField(max_length=64),
        ),
    ]
