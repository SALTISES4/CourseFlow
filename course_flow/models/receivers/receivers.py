from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver

from course_flow.apps import logger
from course_flow.models.comment import Comment
from course_flow.models.favourite import Favourite
from course_flow.models.objectPermission import ObjectPermission, Permission
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.nodeLink import NodeLink
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.outcomeOutcome import OutcomeOutcome
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.workflow_objects.column import Column
from course_flow.models.workflow_objects.node import Node
from course_flow.models.workflow_objects.outcome import Outcome
from course_flow.models.workflow_objects.week import Week
from course_flow.models.workspace.activity import Activity
from course_flow.models.workspace.course import Course
from course_flow.models.workspace.program import Program
from course_flow.models.workspace.project import Project
from course_flow.models.workspace.workflow import Workflow
from course_flow.services import DAO


@receiver(pre_delete, sender=Project)
def delete_project_objects(sender, instance, **kwargs):
    # Pick up all non-linking instances pks
    nodes = list(Node.objects.filter(week__workflow__project=instance).values_list("pk", flat=True))
    weeks = list(Week.objects.filter(workflow__project=instance).values_list("pk", flat=True))
    columns = list(Column.objects.filter(workflow__project=instance).values_list("pk", flat=True))
    outcomes = list(
        Outcome.objects.filter(
            Q(workflow__project=instance)
            | Q(parent_outcomes__workflow__project=instance)
            | Q(parent_outcomes__parent_outcomes__workflow__project=instance)
        ).values_list("pk", flat=True)
    )
    workflows = list(Workflow.objects.filter(project=instance).values_list("pk", flat=True))
    comments = Comment.objects.filter(
        Q(node__week__workflow__project=instance)
        | Q(outcome__in=outcomes)
        | Q(column__workflow__project=instance)
        | Q(week__workflow__project=instance)
    )
    comments.delete()

    # Delete all links. These should be deleted before non-linking instances because this way we prevent a lot of cascades. Order matters here; we want to go from top to bottom or else we will break the links we need in order to find the next step
    outcomenodes = OutcomeNode.objects.filter(node__week__workflow__project=instance)
    outcomenodes._raw_delete(outcomenodes.db)
    nodelinks = NodeLink.objects.filter(source_node__week__workflow__project=instance)
    nodelinks._raw_delete(nodelinks.db)
    outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
        Q(outcome__workflow__project=instance)
        | Q(outcome__parent_outcomes__workflow__project=instance)
        | Q(outcome__parent_outcomes__parent_outcomes__workflow__project=instance)
    )
    outcomehorizontallinks._raw_delete(outcomehorizontallinks.db)
    nodeweeks = NodeWeek.objects.filter(week__workflow__project=instance)
    nodeweeks._raw_delete(nodeweeks.db)
    weekworkflows = WeekWorkflow.objects.filter(workflow__project=instance)
    weekworkflows._raw_delete(weekworkflows.db)
    columnworkflows = ColumnWorkflow.objects.filter(workflow__project=instance)
    columnworkflows._raw_delete(columnworkflows.db)
    outcomeoutcomes = OutcomeOutcome.objects.filter(
        Q(parent__workflow__project=instance)
        | Q(parent__parent_outcomes__workflow__project=instance)
    )
    outcomeoutcomes._raw_delete(outcomeoutcomes.db)
    outcomeworkflows = OutcomeWorkflow.objects.filter(workflow__project=instance)
    outcomeworkflows._raw_delete(outcomeworkflows.db)
    workflowprojects = WorkflowProject.objects.filter(project=instance)
    workflowprojects._raw_delete(workflowprojects.db)

    # remove all FKs pointing to our objects from outside project. The raw deletes don't cascade, so we will get integrity errors if we fail to do this
    #    workflow_subclasses = [workflow.get_subclass() for workflow in workflows]
    #    activities = filter(lambda x: x.type == "activity", workflow_subclasses)
    #    courses = filter(lambda x: x.type == "course", workflow_subclasses)
    #    programs = filter(lambda x: x.type == "program", workflow_subclasses)
    objectpermissions = ObjectPermission.objects.filter(
        Q(workflow__in=workflows) | Q(project=instance)
    )
    favourites = Favourite.objects.filter(Q(workflow__in=workflows) | Q(project=instance))
    Node.objects.filter(parent_node__in=nodes).update(parent_node=None)
    Node.objects.filter(linked_workflow__in=workflows).update(linked_workflow=None)
    Week.objects.filter(parent_week__in=weeks).update(parent_week=None)
    Week.objects.filter(original_strategy__in=workflows).update(original_strategy=None)
    Column.objects.filter(parent_column__in=columns).update(parent_column=None)
    Workflow.objects.filter(parent_workflow__in=workflows).update(parent_workflow=None)
    Outcome.objects.filter(parent_outcome__in=outcomes).update(parent_outcome=None)

    # Delete nonlinking instances
    nodes = Node.objects.filter(pk__in=nodes)
    nodes._raw_delete(nodes.db)
    weeks = Week.objects.filter(pk__in=weeks)
    weeks._raw_delete(weeks.db)
    columns = Column.objects.filter(pk__in=columns)
    columns._raw_delete(columns.db)
    outcomes = Outcome.objects.filter(pk__in=outcomes)
    outcomes._raw_delete(outcomes.db)
    objectpermissions._raw_delete(objectpermissions.db)
    favourites._raw_delete(favourites.db)
    activities = Activity.objects.filter(pk__in=workflows)
    activities._raw_delete(activities.db)
    courses = Course.objects.filter(pk__in=workflows)
    courses._raw_delete(courses.db)
    programs = Program.objects.filter(pk__in=workflows)
    programs._raw_delete(programs.db)
    workflows = Workflow.objects.filter(pk__in=workflows)
    workflows.delete()
    # raw delete was presenting issues with the disciplines for some reason
    # Given that most usage is soft delete, might as well just .delete()
    # workflows._raw_delete(workflows.db)


@receiver(pre_delete, sender=Workflow)
def delete_workflow_objects(sender, instance, **kwargs):
    # Pick up all non-linking instances pks
    nodes = list(Node.objects.filter(week__workflow=instance).values_list("pk", flat=True))
    weeks = list(Week.objects.filter(workflow=instance).values_list("pk", flat=True))
    columns = list(Column.objects.filter(workflow=instance).values_list("pk", flat=True))
    outcomes = list(
        Outcome.objects.filter(
            Q(workflow=instance)
            | Q(parent_outcomes__workflow=instance)
            | Q(parent_outcomes__parent_outcomes__workflow=instance)
        ).values_list("pk", flat=True)
    )

    # Delete all comments.
    comments = Comment.objects.filter(
        Q(node__week__workflow=instance)
        | Q(outcome__in=outcomes)
        | Q(column__workflow=instance)
        | Q(week__workflow=instance)
    )
    comments.delete()

    # Delete all links. These should be deleted before non-linking instances because this way we prevent a lot of cascades. Order matters here; we want to go from top to bottom or else we will break the links we need in order to find the next step
    outcomenodes = OutcomeNode.objects.filter(node__week__workflow=instance)
    outcomenodes._raw_delete(outcomenodes.db)
    nodelinks = NodeLink.objects.filter(source_node__week__workflow=instance)
    nodelinks._raw_delete(nodelinks.db)
    outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
        Q(outcome__workflow=instance)
        | Q(outcome__parent_outcomes__workflow=instance)
        | Q(outcome__parent_outcomes__parent_outcomes__workflow=instance)
        | Q(parent_outcome__workflow=instance)
        | Q(parent_outcome__parent_outcomes__workflow=instance)
        | Q(parent_outcome__parent_outcomes__parent_outcomes__workflow=instance)
    )
    outcomehorizontallinks._raw_delete(outcomehorizontallinks.db)
    nodeweeks = NodeWeek.objects.filter(week__workflow=instance)
    nodeweeks._raw_delete(nodeweeks.db)
    weekworkflows = WeekWorkflow.objects.filter(workflow=instance)
    weekworkflows._raw_delete(weekworkflows.db)
    columnworkflows = ColumnWorkflow.objects.filter(workflow=instance)
    columnworkflows._raw_delete(columnworkflows.db)
    outcomeoutcomes = OutcomeOutcome.objects.filter(
        Q(parent__workflow=instance) | Q(parent__parent_outcomes__workflow=instance)
    )
    outcomeoutcomes._raw_delete(outcomeoutcomes.db)
    outcomeworkflows = OutcomeWorkflow.objects.filter(workflow=instance)
    outcomeworkflows._raw_delete(outcomeworkflows.db)

    # remove all FKs pointing to our objects from outside project. The raw deletes don't cascade, so we will get integrity errors if we fail to do this
    Node.objects.filter(parent_node__in=nodes).update(parent_node=None)
    Week.objects.filter(parent_week__in=weeks).update(parent_week=None)
    Column.objects.filter(parent_column__in=columns).update(parent_column=None)
    Outcome.objects.filter(parent_outcome__in=outcomes).update(parent_outcome=None)

    # Delete nonlinking instances
    nodes = Node.objects.filter(pk__in=nodes)
    nodes._raw_delete(nodes.db)
    weeks = Week.objects.filter(pk__in=weeks)
    weeks._raw_delete(weeks.db)
    columns = Column.objects.filter(pk__in=columns)
    columns._raw_delete(columns.db)
    outcomes = Outcome.objects.filter(pk__in=outcomes)
    outcomes._raw_delete(outcomes.db)


@receiver(pre_delete, sender=Week)
def delete_week_objects(sender, instance, **kwargs):
    instance.nodes.all().delete()


@receiver(pre_delete, sender=Node)
def delete_node_objects(sender, instance, **kwargs):
    instance.outgoing_links.all().delete()
    instance.incoming_links.all().delete()
    if instance.linked_workflow is not None:
        instance.linked_workflow = None
        instance.save()


@receiver(pre_delete, sender=Outcome)
def delete_outcome_objects(sender, instance, **kwargs):
    instance.children.all().delete()


@receiver(pre_delete, sender=Column)
def move_nodes(sender, instance, **kwargs):
    columnworkflow = instance.columnworkflow_set.first()
    if columnworkflow is None:
        print("This column has no columnworkflow, probably orphaned")
        return
    workflow = columnworkflow.workflow

    other_columns = workflow.columnworkflow_set.all().order_by("rank").exclude(column=instance)
    if other_columns.count() > 0:
        new_column = other_columns.first().column
        for node in Node.objects.filter(column=instance):
            node.column = new_column
            node.save()
    else:
        print("couldn't find a column")


@receiver(pre_delete, sender=NodeWeek)
def reorder_for_deleted_node_week(sender, instance, **kwargs):
    for out_of_order_link in NodeWeek.objects.filter(week=instance.week, rank__gt=instance.rank):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=WeekWorkflow)
def reorder_for_deleted_week_workflow(sender, instance, **kwargs):
    for out_of_order_link in WeekWorkflow.objects.filter(
        workflow=instance.workflow, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=ColumnWorkflow)
def reorder_for_deleted_column_workflow(sender, instance, **kwargs):
    for out_of_order_link in ColumnWorkflow.objects.filter(
        workflow=instance.workflow, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=OutcomeWorkflow)
def reorder_for_deleted_outcome_workflow(sender, instance, **kwargs):
    for out_of_order_link in OutcomeWorkflow.objects.filter(
        workflow=instance.workflow, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=OutcomeOutcome)
def reorder_for_deleted_outcome_outcome(sender, instance, **kwargs):
    for out_of_order_link in OutcomeOutcome.objects.filter(
        parent=instance.parent, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_save, sender=WorkflowProject)
def delete_existing_workflow_project(sender, instance, **kwargs):
    if instance.pk is None:
        WorkflowProject.objects.filter(workflow=instance.workflow).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = WorkflowProject.objects.filter(project=instance.project).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(pre_save, sender=NodeWeek)
def delete_existing_node_week(sender, instance, **kwargs):
    if instance.pk is None:
        try:
            NodeWeek.objects.filter(node=instance.node).delete()
        except Exception as e:
            logger.exception("An error occurred")
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = NodeWeek.objects.filter(week=instance.week).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=NodeWeek)
def reorder_for_created_node_week(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in NodeWeek.objects.filter(
            week=instance.week, rank__gte=instance.rank
        ).exclude(node=instance.node):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=WeekWorkflow)
def delete_existing_week_workflow(sender, instance, **kwargs):
    if instance.pk is None:
        WeekWorkflow.objects.filter(week=instance.week).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = WeekWorkflow.objects.filter(workflow=instance.workflow).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=WeekWorkflow)
def reorder_for_created_week_workflow(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in WeekWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(week=instance.week):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=ColumnWorkflow)
def delete_existing_column_workflow(sender, instance, **kwargs):
    if instance.pk is None:
        ColumnWorkflow.objects.filter(column=instance.column).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = ColumnWorkflow.objects.filter(workflow=instance.workflow).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=ColumnWorkflow)
def reorder_for_created_column_workflow(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in ColumnWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(column=instance.column):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=OutcomeWorkflow)
def delete_existing_outcome_workflow(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeWorkflow.objects.filter(outcome=instance.outcome).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeWorkflow.objects.filter(workflow=instance.workflow).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=OutcomeWorkflow)
def reorder_for_created_outcome_workflow(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in OutcomeWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(outcome=instance.outcome):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=OutcomeOutcome)
def delete_existing_outcome_outcome(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeOutcome.objects.filter(child=instance.child).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeOutcome.objects.filter(parent=instance.parent).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=OutcomeOutcome)
def reorder_for_created_outcome_outcome(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in OutcomeOutcome.objects.filter(
            parent=instance.parent, rank__gte=instance.rank
        ).exclude(child=instance.child):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=OutcomeNode)
def delete_existing_outcome_node(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeNode.objects.filter(node=instance.node, outcome=instance.outcome).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeNode.objects.filter(node=instance.node).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(pre_save, sender=OutcomeHorizontalLink)
def delete_existing_horizontal_link(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeHorizontalLink.objects.filter(
            outcome=instance.outcome, parent_outcome=instance.parent_outcome
        ).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeHorizontalLink.objects.filter(outcome=instance.outcome).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=ObjectPermission)
def set_permissions_to_project_objects(sender, instance, created, **kwargs):
    if created:
        if instance.content_type == ContentType.objects.get_for_model(Project):
            workflows = instance.content_object.workflows.all()
            for workflow in workflows:
                # If user already has edit or comment permissions and we are adding view, do not override
                if (
                    instance.permission_type == Permission.PERMISSION_VIEW.value
                    and ObjectPermission.objects.filter(
                        user=instance.user,
                        content_type=ContentType.objects.get_for_model(workflow),
                        object_id=workflow.id,
                        permission_type__in=[
                            Permission.PERMISSION_EDIT.value,
                            Permission.PERMISSION_COMMENT.value,
                        ],
                    ).count()
                    > 0
                ):
                    pass
                elif (
                    instance.permission_type == Permission.PERMISSION_COMMENT.value
                    and ObjectPermission.objects.filter(
                        user=instance.user,
                        content_type=ContentType.objects.get_for_model(workflow),
                        object_id=workflow.id,
                        permission_type__in=[Permission.PERMISSION_EDIT.value],
                    ).count()
                    > 0
                ):
                    pass
                else:
                    # If user is the owner, don't override their ownership
                    if workflow.author == instance.user:
                        if (
                            ObjectPermission.objects.filter(
                                workflow=workflow,
                                user=instance.user,
                                permission_type=Permission.PERMISSION_EDIT.value,
                            ).count()
                            == 0
                        ):
                            # Just in case the user has somehow lost their permission
                            ObjectPermission.objects.create(
                                user=instance.user,
                                content_object=workflow,
                                permission_type=Permission.PERMISSION_EDIT.value,
                            )
                    else:
                        ObjectPermission.objects.create(
                            user=instance.user,
                            content_object=workflow,
                            permission_type=instance.permission_type,
                        )

        elif instance.content_type == ContentType.objects.get_for_model(Workflow):
            workflow = instance.content_object
            project = workflow.get_project()
            if project is not None:
                if (
                    ObjectPermission.objects.filter(
                        user=instance.user,
                        object_id=project.id,
                        content_type=ContentType.objects.get_for_model(Project),
                    ).count()
                    == 0
                ):
                    ObjectPermission.objects.create(
                        content_object=project,
                        user=instance.user,
                        permission_type=Permission.PERMISSION_VIEW.value,
                    )


@receiver(post_save, sender=ObjectPermission)
def delete_permission_none(sender, instance, **kwargs):
    if instance.permission_type == instance.PERMISSION_NONE:
        instance.delete()


@receiver(pre_save, sender=ObjectPermission)
def delete_existing_permission(sender, instance, **kwargs):
    ObjectPermission.objects.filter(
        user=instance.user,
        content_type=instance.content_type,
        object_id=instance.object_id,
    ).delete()


@receiver(pre_delete, sender=ObjectPermission)
def remove_permissions_to_project_objects(sender, instance, **kwargs):
    if instance.content_type == ContentType.objects.get_for_model(Project):
        for workflow in instance.content_object.workflows.all():
            # @todo try this pattern when you are ready to fix the superclass/subclass coupling error
            # Using ContentType to dynamically get the actual model class and id
            # workflow_type = ContentType.objects.get_for_model(workflow, for_concrete_model=False)
            # real_workflow = workflow_type.get_object_for_this_type(pk=workflow.pk)

            ObjectPermission.objects.filter(
                user=instance.user,
                content_type=ContentType.objects.get_for_model(workflow),
                # @todo fix this
                object_id=workflow.get_subclass().id,
            ).delete()


@receiver(post_save, sender=Project)
def set_publication_of_project_objects(sender, instance, created, **kwargs):
    for workflow in instance.workflows.all():
        workflow.published = instance.published
        workflow.disciplines.set(instance.disciplines.all())
        workflow.save()


@receiver(post_save, sender=NodeWeek)
def set_node_type_default(sender, instance, created, **kwargs):
    node = instance.node
    try:
        node.node_type = instance.week.week_type
        node.save()
    except ValidationError as e:
        logger.exception("An error occurred")
        print("couldn't set default node type")


@receiver(post_save, sender=WeekWorkflow)
def set_week_type_default(sender, instance, created, **kwargs):
    week = instance.week
    try:
        # @todo fix this
        week.week_type = instance.workflow.get_subclass().WORKFLOW_TYPE
        week.save()
    except ValidationError as e:
        logger.exception("An error occurred")
        print("couldn't set default week type")


@receiver(post_save, sender=OutcomeOutcome)
def set_outcome_depth_default(sender, instance, created, **kwargs):
    if created:
        try:
            set_list = list(instance.parent.sets.all())
            outcomes, outcomeoutcomes = DAO.get_all_outcomes_for_outcome(instance.child)
            outcomenodes_to_add = OutcomeNode.objects.filter(outcome=instance.parent)
            horizontallinks_to_add = OutcomeHorizontalLink.objects.filter(
                parent_outcome=instance.parent
            )
            for outcomeoutcome in [instance] + list(outcomeoutcomes):
                child = outcomeoutcome.child
                parent = outcomeoutcome.parent
                child.depth = parent.depth + 1
                child.sets.clear()
                child.sets.add(*set_list)
                child.save()
                for outcomenode in outcomenodes_to_add:
                    OutcomeNode.objects.create(
                        node=outcomenode.node,
                        outcome=outcomeoutcome.child,
                        degree=outcomenode.degree,
                    )
                for horizontallink in horizontallinks_to_add:
                    OutcomeHorizontalLink.objects.create(
                        outcome=horizontallink.outcome,
                        parent_outcome=outcomeoutcome.child,
                        degree=horizontallink.degree,
                    )
        except ValidationError as e:
            logger.exception("An error occurred")
            print("couldn't set default outcome depth or copy sets")


@receiver(post_save, sender=Node)
def create_default_node_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If this is an activity-level node, set the autolinks to true
        if instance.node_type == instance.ACTIVITY_NODE:
            instance.has_autolink = True
            instance.save()
        elif instance.node_type == instance.PROGRAM_NODE:
            instance.time_units = instance.CREDITS
            instance.save()


@receiver(post_save, sender=Activity)
def create_default_activity_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = instance.DEFAULT_COLUMNS
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.weeks.create(
            week_type=Week.PART,
            author=instance.author,
            is_strategy=instance.is_strategy,
        )
        instance.save()


@receiver(post_save, sender=Course)
def create_default_course_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = instance.DEFAULT_COLUMNS
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.weeks.create(
            week_type=Week.WEEK,
            author=instance.author,
            is_strategy=instance.is_strategy,
        )
        instance.time_units = instance.CREDITS
        instance.save()


@receiver(post_save, sender=Program)
def create_default_program_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = instance.DEFAULT_COLUMNS
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.weeks.create(
            week_type=Week.TERM,
            author=instance.author,
            is_strategy=instance.is_strategy,
        )
        instance.condensed = True
        instance.save()


@receiver(post_save, sender=Project)
@receiver(post_save, sender=Workflow)
def add_default_editor_workflow(sender, instance, created, **kwargs):
    if created and instance.author is not None:
        ObjectPermission.objects.create(
            content_object=instance,
            user=instance.author,
            permission_type=Permission.PERMISSION_EDIT.value,
        )


@receiver(post_save, sender=Activity)
@receiver(post_save, sender=Course)
@receiver(post_save, sender=Program)
def add_default_editor_other_workflow(sender, instance, created, **kwargs):
    instance = Workflow.objects.get(pk=instance.pk)
    if created and instance.author is not None:
        ObjectPermission.objects.create(
            content_object=instance,
            user=instance.author,
            permission_type=Permission.PERMISSION_EDIT.value,
        )


@receiver(post_save, sender=WorkflowProject)
def set_publication_workflow(sender, instance, created, **kwargs):
    if created:
        # Set the workflow's publication status to that of the project
        workflow = instance.workflow
        workflow.published = instance.project.published
        workflow.disciplines.set(instance.project.disciplines.all())
        # @todo fix this
        if instance.project.author != workflow.get_subclass().author:
            ObjectPermission.objects.create(
                content_object=workflow.get_subclass(),
                user=instance.project.author,
                permission_type=Permission.PERMISSION_EDIT.value,
            )
        for op in ObjectPermission.objects.filter(
            content_type=ContentType.objects.get_for_model(instance.project),
            object_id=instance.project.id,
        ):
            ObjectPermission.objects.create(
                content_object=workflow,
                user=op.user,
                permission_type=op.permission_type,
            )
        workflow.save()


@receiver(post_save, sender=Project)
def project_ensure_template_from_saltise(sender, instance, created, **kwargs):
    if instance.is_template:
        if instance.published:
            if not instance.from_saltise:
                instance.from_saltise = True
                instance.save()
        else:
            instance.is_template = False
            instance.save()


@receiver(post_save, sender=Workflow)
def workflow_ensure_template_from_saltise(sender, instance, created, **kwargs):
    if instance.is_template:
        if instance.published:
            if not instance.from_saltise:
                instance.from_saltise = True
                instance.save()
        else:
            instance.is_template = False
            instance.save()
