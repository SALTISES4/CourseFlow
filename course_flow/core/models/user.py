import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser, Group
from django.db import models, transaction

from course_flow.core.enum import AccountRole, LanguagePreference

LANGUAGE_PREFERENCES_CHOICES = [(e.value, e.name.title()) for e in LanguagePreference]


class CourseFlowUserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("The email field must be set.")

        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(
        self,
        email: str,
        password: str | None = None,
        *,
        account_role: AccountRole | str = AccountRole.STUDENT,
        **extra_fields,
    ):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        with transaction.atomic():
            user = self._create_user(email, password, **extra_fields)
            user.set_account_role(account_role)
        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields,
    ):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        with transaction.atomic():
            user = self._create_user(email, password, **extra_fields)
            user.set_account_role(AccountRole.ADMIN)
        return user


class User(AbstractUser):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    email = models.EmailField(unique=True)
    language_preference = models.CharField(
        max_length=5,
        choices=LANGUAGE_PREFERENCES_CHOICES,
        default=LanguagePreference.EN.value,
    )
    notifications_active = models.BooleanField(default=False)
    objects = CourseFlowUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        db_table = "cf_user"

    def save(self, *args, **kwargs):
        self.username = self.email
        super().save(*args, **kwargs)

    @property
    def account_role(self) -> AccountRole | None:
        """Return the single canonical account role, or ``None`` for invalid data."""
        if self.is_superuser:
            return AccountRole.ADMIN
        canonical_names = {role.value for role in AccountRole}
        assigned = [
            AccountRole(group.name)
            for group in self.groups.all()
            if group.name in canonical_names
        ]
        return assigned[0] if len(assigned) == 1 else None

    def set_account_role(self, role: AccountRole | str) -> None:
        """Replace this user's canonical account role while preserving other groups."""
        resolved = AccountRole(role)
        canonical_names = [candidate.value for candidate in AccountRole]
        with transaction.atomic():
            type(self).objects.select_for_update().get(pk=self.pk)
            self.groups.remove(*self.groups.filter(name__in=canonical_names))
            group, _ = Group.objects.get_or_create(name=resolved.value)
            self.groups.add(group)
