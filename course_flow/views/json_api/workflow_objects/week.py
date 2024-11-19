from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Prefetch
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.duplication_functions import fast_duplicate_week
from course_flow.models import NodeWeek, Week, WeekWorkflow, Workflow
from course_flow.serializers import (
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
)
from course_flow.sockets.emitters import WorkflowUpdateEmitter


class WeekEndpoint:
    @staticmethod
    @api_view(["POST"])
    def create(request):
        """
        Creates a new week and inserts it into an existing workflow at a specified rank.
        Adjusts the ranks of other weeks in the workflow accordingly.

        :param request: HTTP request object containing 'workflow_id', 'name', and 'rank'.
        :return: HTTP response with success or error message.
        """
        body = request.data
        workflow_id = body.get("workflow_id")
        week_name = body.get("name")
        rank = body.get("rank")

        if not workflow_id or not week_name or rank is None or rank < 1:
            return Response({"error": "Missing or invalid data provided."}, status=400)

        try:
            with transaction.atomic():
                # Fetch the workflow
                workflow = Workflow.objects.get(id=workflow_id)

                # Create the new week
                new_week = Week.objects.create(name=week_name)

                # Fetch all WorkflowWeek instances in the same workflow ordered by their current ranks
                all_workflow_weeks = WeekWorkflow.objects.filter(workflow=workflow).order_by("rank")

                # Initialize list for updated ranks
                new_ranks = []
                inserted = False
                current_rank = 1

                # Iterate through all weeks and reassign ranks
                for workflow_week in all_workflow_weeks:
                    if current_rank == rank and not inserted:
                        # Insert the new week at the specified rank
                        new_ranks.append((new_week, rank))
                        inserted = True
                        current_rank += 1

                    new_ranks.append((workflow_week.week, current_rank))
                    current_rank += 1

                # If the new week should be last
                if not inserted:
                    new_ranks.append((new_week, rank))

                # Update ranks for all involved weeks and create WorkflowWeek link
                for week, new_rank in new_ranks:
                    WeekWorkflow.objects.update_or_create(
                        week=week, workflow=workflow, defaults={"rank": new_rank}
                    )

                return Response(
                    {"message": "New week created and ordered successfully."}, status=201
                )

        except Workflow.DoesNotExist:
            return Response({"error": "Workflow not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @staticmethod
    @api_view(["POST"])
    def duplicate(request: Request) -> Response:
        """
        Duplicates a week along with its associations within the workflow.

        :param request: HTTP request object containing necessary identifiers and type information.
        :return: HTTP response with serialized data for the new week and its associations.
        """
        body = request.data
        week_id = body.get("week_id")
        parent_workflow_id = body.get("parent_workflow_id")

        try:
            with transaction.atomic():
                original_week = Week.objects.get(id=week_id)
                parent_workflow = Workflow.objects.get(id=parent_workflow_id)

                # Duplicate the week
                new_week = fast_duplicate_week(original_week, request.user)
                new_week.title += _("(copy)")
                new_week.save()

                # Create a new through model instance
                original_through_model = WeekWorkflow.objects.get(
                    week=original_week, workflow=parent_workflow
                )
                new_through_model = WeekWorkflow.objects.create(
                    workflow=parent_workflow, week=new_week, rank=original_through_model.rank + 1
                )

                # Serialize the new week and its through model
                new_week_serialized = WeekSerializerShallow(new_week).data
                new_through_serialized = WeekWorkflowSerializerShallow(new_through_model).data

                # Prepare response data
                response_data = {
                    "new_model": new_week_serialized,
                    "new_through": new_through_serialized,
                    "parent_id": parent_workflow_id,
                }

                # Optionally, trigger any update emitters if needed
                workflow = original_week.get_workflow()
                WorkflowUpdateEmitter.emit_workflow_update(
                    workflow,
                    WorkflowUpdateEmitter.insert_below_action(response_data, "week"),
                )

                return Response(
                    {"message": "Week duplicated successfully", "data": response_data},
                    status=status.HTTP_200_OK,
                )

        except Week.DoesNotExist:
            return Response({"error": "Week not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    @api_view(["POST"])
    def change_position(request, pk):
        """
        Change the order of weeks within a workflow. This method adjusts the rank of a week
        and updates the ranks of other weeks in the same workflow accordingly through the WorkflowWeek through model.

        :param request: HTTP request object containing 'rank'.
        :param pk: Primary key of the week to be reordered.
        :return: HTTP response with success or error message.
        """
        body = request.data
        rank = body.get("rank")
        if rank is None or rank < 1:
            return Response({"error": "Invalid rank provided."}, status=400)

        try:
            with transaction.atomic():
                # Fetch the week and its associated WorkflowWeek instance
                workflow_week = WeekWorkflow.objects.select_related("week").get(week__id=pk)
                current_workflow_id = workflow_week.workflow.id

                # Fetch all WorkflowWeek instances in the same workflow ordered by their current ranks
                all_workflow_weeks = (
                    WeekWorkflow.objects.filter(workflow_id=current_workflow_id)
                    .exclude(week_id=pk)
                    .order_by("rank")
                )

                # Initialize list for updated ranks
                new_ranks = []
                inserted = False
                current_rank = 1

                # Iterate through all weeks and reassign ranks
                for current_workflow_week in all_workflow_weeks:
                    if current_rank == rank and not inserted:
                        # Insert the moved week at the new rank
                        new_ranks.append((workflow_week, rank))
                        inserted = True
                        current_rank += 1

                    new_ranks.append((current_workflow_week, current_rank))
                    current_rank += 1

                # If the moved week should be last
                if not inserted:
                    new_ranks.append((workflow_week, rank))

                # Update ranks for all involved weeks
                for workflow_week, new_rank in new_ranks:
                    workflow_week.rank = new_rank
                    workflow_week.save()

                # Optional: Emit changes via an emitter if necessary
                # Example emitter code commented out for customization
                # workflow_update(workflow_id=current_workflow_id)

                return Response({"message": "Week reordered successfully."}, status=200)

        except WeekWorkflow.DoesNotExist:
            return Response({"error": "Week not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @staticmethod
    @api_view(["DELETE"])
    def delete(request, pk):
        """
        Deletes a week and all associated nodeweeks, and retrieves all nodes associated with these nodeweeks.
        This operation is atomic, ensuring all or nothing is committed to the database.

        :param request: The HTTP request object.
        :param pk: The primary key of the week to delete.
        :return: A response object indicating success or failure.
        """
        try:
            with transaction.atomic():
                # Retrieve the week along with its nodeweeks and associated nodes
                week = Week.objects.prefetch_related(
                    Prefetch("nodeweeks", queryset=NodeWeek.objects.select_related("node"))
                ).get(id=pk)

                # Collect all nodes associated with the week before deletion
                nodes_to_delete = [nw.node for nw in week.nodeweeks.all()]

                # Delete the week; related nodeweeks will be deleted by cascade
                week.delete()

                # Delete all child (orphan) nodes
                # to verify cascades onto nodelinks
                for node in nodes_to_delete:
                    node.delete()

                return Response(
                    {"message": "Week and all related entities deleted successfully."}, status=200
                )

        except Week.DoesNotExist:
            return Response({"error": "Week not found."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
