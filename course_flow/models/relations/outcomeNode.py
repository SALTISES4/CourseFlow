from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models.workflow_objects.node import Node
from course_flow.models.workflow_objects.outcome import Outcome
from course_flow.services import DAO


class OutcomeNode(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)
    degree = models.PositiveIntegerField(default=1)

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    def get_workflow(self):
        return self.node.get_workflow()

    def get_top_outcome(self):
        return self.outcome.get_top_outcome()

    class Meta:
        verbose_name = _("Outcome-Node Link")
        verbose_name_plural = _("Outcome-Node Links")

    # Check to see if the parent has all its children the same, and add it if necessary
    def check_parent_outcomes(self):
        if self.outcome.parent_outcomes.count() > 0:
            parent_outcome = self.outcome.parent_outcomes.first()
            if (
                OutcomeNode.objects.filter(
                    outcome__in=parent_outcome.children.exclude(deleted=True).values_list(
                        "id", flat=True
                    ),
                    degree=self.degree,
                    node=self.node,
                ).count()
                == parent_outcome.children.exclude(deleted=True).count()
            ):
                new_outcomenode = OutcomeNode.objects.create(
                    node=self.node, degree=self.degree, outcome=parent_outcome
                )
                return [new_outcomenode] + new_outcomenode.check_parent_outcomes()
            elif OutcomeNode.objects.filter(outcome=parent_outcome, node=self.node).count() > 0:
                new_outcomenode = OutcomeNode.objects.create(
                    node=self.node, degree=0, outcome=parent_outcome
                )
                return [new_outcomenode] + new_outcomenode.check_parent_outcomes()

        return []

    # Check to see if the children already exist, and if not, add them
    def check_child_outcomes(self):
        node = self.node
        outcome = self.outcome
        degree = self.degree
        # Get the descendants (all descendant outcomes that don't already have an outcomenode of this degree and node)
        # this is causing a circular import, and should probably not be in services
        descendants = DAO.get_descendant_outcomes(outcome).exclude(
            outcomenode__in=OutcomeNode.objects.filter(node=node, degree=degree)
        )

        # Delete the outcomenodes of any descendants that still
        # have an outcomenode to this node (i.e. clear those of other
        # degrees, we are using bulk create so they won't get automatically deleted)
        to_delete = OutcomeNode.objects.filter(
            outcome__in=descendants.values_list("pk", flat=True), node=node
        )
        to_delete.delete()

        # Create the new outcomenodes with bulk_create
        now = timezone.now()
        new_children = [
            OutcomeNode(degree=degree, node=node, outcome=x, added_on=now) for x in descendants
        ]

        OutcomeNode.objects.bulk_create(new_children)

        return list(OutcomeNode.objects.filter(added_on=now))
