from django.db import migrations, models

ACCOUNT_ROLE_NAMES = ("admin", "teacher", "student")
TEAM_ROLE_NAMES = ("editor", "commenter", "viewer")


def assign_missing_account_roles(apps, schema_editor) -> None:
    Group = apps.get_model("auth", "Group")
    User = apps.get_model("cf_core", "User")

    groups = {
        name: Group.objects.get_or_create(name=name)[0]
        for name in ACCOUNT_ROLE_NAMES
    }
    for user in User.objects.prefetch_related("groups"):
        canonical = [
            group for group in user.groups.all() if group.name in ACCOUNT_ROLE_NAMES
        ]
        if user.is_superuser:
            user.groups.remove(*canonical)
            user.groups.add(groups["admin"])
        elif len(canonical) != 1:
            # Ambiguous legacy assignments fail toward the least-privileged
            # account role while establishing the one-role invariant.
            user.groups.remove(*canonical)
            user.groups.add(groups["student"])


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0012_canonical_user_groups"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="is_archived",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="workflow",
            name="is_archived",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(assign_missing_account_roles, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="teamuser",
            constraint=models.CheckConstraint(
                condition=models.Q(role__in=TEAM_ROLE_NAMES),
                name="cf_team_user_role_valid",
            ),
        ),
    ]
