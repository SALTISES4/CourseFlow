# Generated by Django 2.2.16 on 2020-11-03 18:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course_flow', '0023_auto_20201102_2227'),
    ]

    operations = [
        migrations.AddField(
            model_name='column',
            name='published',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='node',
            name='published',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='nodelink',
            name='published',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='outcome',
            name='published',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='published',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='strategy',
            name='published',
            field=models.BooleanField(default=False),
        ),
    ]