from django.core.management.base import BaseCommand

from course_flow.models import Column, Node, NodeLink, Outcome, Week, Workflow


class Command(BaseCommand):
    def add_arguments(self, parser):
        pass

    def handle(self, *args, **kwargs):
        # Deletes all the orphaned material. This can be produced when copying/importing is interrupted. Use with extreme caution.
        orphaned_nodes = Node.objects.filter(nodeweek=None)
        print(
            "There are "
            + str(orphaned_nodes.count())
            + " orphaned nodes in existence"
        )
        orphaned_nodes.delete()
        orphaned_nodelinks = NodeLink.objects.filter(source_node=None)
        print(
            "There are "
            + str(orphaned_nodelinks.count())
            + " orphaned nodelinks in existence"
        )
        orphaned_nodelinks.delete()
        orphaned_weeks = Week.objects.filter(weekworkflow=None)
        print(
            "There are "
            + str(orphaned_weeks.count())
            + " orphaned weeks in existence"
        )
        orphaned_weeks.delete()
        orphaned_columns = Column.objects.filter(columnworkflow=None)
        print(
            "There are "
            + str(orphaned_columns.count())
            + " orphaned columns in existence"
        )
        orphaned_columns.delete()
        orphaned_outcomes = Outcome.objects.filter(
            outcomeworkflow=None, parent_outcome_links=None
        )
        orphaned_workflows = Workflow.objects.filter(
            workflowproject=None, is_strategy=False
        )
        print(
            "There are "
            + str(orphaned_workflows.count())
            + " orphaned workflows in existence"
        )
        print(
            "There are "
            + str(orphaned_outcomes.count())
            + " orphaned outcomes in existence"
        )
        orphaned_outcomes.delete()
        orphaned_workflows.delete()
