from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0026_canonical_duration_minutes"),
    ]

    operations = [
        migrations.AddField(
            model_name="favoriteproject",
            name="date_created",
            field=models.DateTimeField(auto_now_add=True, default=timezone.now),
            preserve_default=False,
        ),
    ]
