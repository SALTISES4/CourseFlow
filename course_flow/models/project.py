import base64
import uuid

from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models._common import User, title_max_length


class Project(models.Model):
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    description = models.TextField(null=True, blank=True)
    author = models.ForeignKey(
        User,
        related_name="authored_projects",
        on_delete=models.SET_NULL,
        null=True,
    )
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)

    from_saltise = models.BooleanField(default=False)

    is_strategy = models.BooleanField(default=False)

    workflows = models.ManyToManyField(
        "Workflow", through="WorkflowProject", blank=True
    )

    is_original = models.BooleanField(default=False)
    parent_project = models.ForeignKey(
        "Project", on_delete=models.SET_NULL, null=True
    )

    disciplines = models.ManyToManyField("Discipline", blank=True)

    favourited_by = GenericRelation("Favourite", related_query_name="project")
    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="project"
    )

    object_sets = models.ManyToManyField("ObjectSet", blank=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    @staticmethod
    def get_from_hash(hash_):
        try:
            hash_ = base64.urlsafe_b64decode(hash_.encode()).decode()
        except UnicodeDecodeError:
            hash_ = None
        if hash_:
            try:
                project = Project.objects.get(hash=hash_)
            except (Project.DoesNotExist, ValidationError):
                project = None
        else:
            project = None

        return project

    def registration_hash(self):
        return base64.urlsafe_b64encode(str(self.hash).encode()).decode()

    @property
    def type(self):
        return "project"

    def get_project(self):
        return self

    def get_live_project(self):
        try:
            liveproject = self.liveproject
        except AttributeError:
            liveproject = None
        return liveproject

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return "Project"

    class Meta:
        verbose_name = _("Project")
        verbose_name_plural = _("Projects")
