import base64

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from course_flow.apps import logger
from course_flow.models._abstract import AbstractWorkspaceModel

User = get_user_model()


class Project(AbstractWorkspaceModel):
    author = models.ForeignKey(
        User,
        related_name="authored_projects",
        on_delete=models.SET_NULL,
        null=True,
    )

    ##########################################################
    # FIELDS
    #########################################################

    published = models.BooleanField(default=False)

    is_original = models.BooleanField(default=False)

    #########################################################
    # RELATIONS
    #########################################################
    user_permissions = GenericRelation("ObjectPermission", related_query_name="project")

    favourited_by = GenericRelation("Favourite", related_query_name="project")

    # @todo why does a project have a parent project?
    parent_project = models.ForeignKey("Project", on_delete=models.SET_NULL, null=True)

    # @todo this is wrong, no reason for this to be n2m
    workflows = models.ManyToManyField("Workflow", through="WorkflowProject", blank=True)

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
        except UnicodeDecodeError as e:
            logger.exception("An error occurred")
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
    #     except AttributeError as e:
    #                logger.exception("An error occurred")
    #         liveproject = None
    #     return liveproject

    def get_permission_objects(self):
        return [self]
