from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("cf_core", "0020_remove_discipline_presentation_fields")]

    operations = [
        migrations.RenameField(
            model_name="notification",
            old_name="message",
            new_name="legacy_message",
        ),
        migrations.AlterField(
            model_name="notification",
            name="legacy_message",
            field=models.CharField(blank=True, max_length=1024, null=True),
        ),
        migrations.AddField(
            model_name="notification",
            name="message_code",
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        migrations.AddField(
            model_name="notification",
            name="message_params",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddConstraint(
            model_name="notification",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(message_code__isnull=False, legacy_message__isnull=True)
                    | models.Q(message_code__isnull=True, legacy_message__isnull=False)
                ),
                name="cf_notification_message_code_xor_legacy",
            ),
        ),
    ]
