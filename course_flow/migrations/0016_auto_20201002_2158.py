# Generated by Django 2.2.16 on 2020-10-02 21:58

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [("course_flow", "0015_auto_20201002_2156")]

    operations = [
        migrations.RenameField(
            model_name="node", old_name="classification", new_name="node_type"
        )
    ]
