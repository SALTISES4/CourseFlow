from django.db import migrations

from course_flow.core.enum import UserGroup


def create_canonical_user_groups(apps, schema_editor) -> None:
    Group = apps.get_model("auth", "Group")
    for group in UserGroup:
        Group.objects.get_or_create(name=group.value)


def delete_canonical_user_groups(apps, schema_editor) -> None:
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name__in=[g.value for g in UserGroup]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0011_alter_node_linked_workflow_alter_node_workflow"),
    ]

    operations = [
        migrations.RunPython(create_canonical_user_groups, delete_canonical_user_groups),
    ]
