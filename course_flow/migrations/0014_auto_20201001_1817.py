# Generated by Django 2.2.16 on 2020-10-01 18:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course_flow', '0013_auto_20200930_2043'),
    ]

    operations = [
        migrations.AddField(
            model_name='strategy',
            name='strategy_type',
            field=models.PositiveIntegerField(choices=[(0, 'Part'), (1, 'Week'), (2, 'Term')], default=0),
        ),
        migrations.AlterField(
            model_name='node',
            name='classification',
            field=models.PositiveIntegerField(choices=[(0, 'Activity Node'), (1, 'Course Node'), (2, 'Program Node')], default=0),
        ),
    ]