"""Generate deterministic dev notifications for the admin user."""

from __future__ import annotations

import json

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from faker import Faker

from course_flow.core.models import Notification

ADMIN_EMAIL = "admin@courseflow.com"
DEFAULT_PASSWORD = "dev-seed-password"


def _ensure_admin_user():
    user_model = get_user_model()
    admin, _ = user_model.objects.get_or_create(
        email=ADMIN_EMAIL,
        defaults={
            "first_name": "Admin",
            "last_name": "CourseFlow",
            "is_staff": True,
            "is_superuser": True,
        },
    )
    changed = False
    if not admin.is_staff:
        admin.is_staff = True
        changed = True
    if not admin.is_superuser:
        admin.is_superuser = True
        changed = True
    if not admin.has_usable_password():
        admin.set_password(DEFAULT_PASSWORD)
        changed = True
    if changed:
        admin.save()
    return admin


class Command(BaseCommand):
    help = "Create deterministic dev notifications for admin@courseflow.com."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--count",
            type=int,
            default=20,
            help="How many notifications to create (default: 20).",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="Deterministic seed for Faker message generation (default: 42).",
        )
        parser.add_argument(
            "--clear-first",
            action="store_true",
            help="Delete existing notifications for admin before seeding.",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Print machine-readable JSON only.",
        )

    def handle(self, *args, **options) -> None:
        count = max(0, int(options["count"]))
        seed = int(options["seed"])
        clear_first = bool(options["clear_first"])
        json_only = bool(options["json"])

        admin = _ensure_admin_user()

        cleared = 0
        if clear_first:
            cleared, _ = Notification.objects.filter(user=admin).delete()

        fake = Faker()
        fake.seed_instance(seed)

        created: list[str] = []
        for i in range(count):
            msg = f"[DEV-SEED:{seed}:{i + 1}] {fake.sentence(nb_words=9)}"
            n = Notification.objects.create(
                user=admin,
                message=msg,
                is_read=(i % 4 == 0),
            )
            created.append(str(n.uuid))

        payload = {
            "user_email": admin.email,
            "user_id": admin.id,
            "seed": seed,
            "count_requested": count,
            "cleared_count": cleared,
            "created_count": len(created),
            "created_notification_uuids": created,
        }
        if json_only:
            self.stdout.write(json.dumps(payload))
            return

        self.stdout.write(
            f"Seeded {payload['created_count']} notifications for {admin.email}."
        )
        self.stdout.write(json.dumps(payload, indent=2))
