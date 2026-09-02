from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("cf_core", "0019_workflow_public_link_enabled")]

    operations = [
        migrations.RemoveField(
            model_name="discipline",
            name="label",
        ),
        migrations.RemoveField(
            model_name="discipline",
            name="translation_plural",
        ),
    ]
