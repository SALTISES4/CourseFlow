import base64
import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from ._abstract import AbstractCourseFlowModel

User = get_user_model()


class Project(AbstractCourseFlowModel):
    author = models.ForeignKey(
        User,
        related_name="authored_projects",
        on_delete=models.SET_NULL,
        null=True,
    )

    ##########################################################
    # FIELDS
    #########################################################
    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    published = models.BooleanField(default=False)

    from_saltise = models.BooleanField(default=False)

    is_template = models.BooleanField(default=False)

    is_strategy = models.BooleanField(default=False)

    is_original = models.BooleanField(default=False)

    #########################################################
    # RELATIONS
    #########################################################
    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="project"
    )

    favourited_by = GenericRelation("Favourite", related_query_name="project")

    parent_project = models.ForeignKey(
        "Project", on_delete=models.SET_NULL, null=True
    )

    workflows = models.ManyToManyField(
        "Workflow", through="WorkflowProject", blank=True
    )

    disciplines = models.ManyToManyField("Discipline", blank=True)

    object_sets = models.ManyToManyField("ObjectSet", blank=True)

    #########################################################
    # PROPERTIES
    #########################################################
    @property
    def type(self):
        return "project"

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return "Project"

    #########################################################
    # META
    #########################################################
    class Meta:
        verbose_name = _("Project")
        verbose_name_plural = _("Projects")

    #########################################################
    # MODEL METHODS / GETTERS
    #########################################################
    # probably used in the public link view
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

    def get_project(self):
        return self

    # def get_live_project(self):
    #     try:
    #         liveproject = self.liveproject
    #     except AttributeError:
    #         liveproject = None
    #     return liveproject

    def get_permission_objects(self):
        return [self]
