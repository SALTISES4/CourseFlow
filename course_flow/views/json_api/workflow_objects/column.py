from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response

from course_flow.models import Column, ColumnWorkflow, Node, Workflow


class ColumnEndpoint:
    @staticmethod
    @api_view(["POST"])
    def create(request):
        """
        Creates a new column and inserts it into an existing workflow at a specified rank.
        Adjusts the ranks of other columns in the workflow accordingly.

        :param request: HTTP request object containing 'workflow_id', 'name', and 'rank'.
        :return: HTTP response with success or error message.
        """
        body = request.data
        workflow_id = body.get("workflow_id")
        column_name = body.get("name")
        rank = body.get("rank")

        if not workflow_id or not column_name or rank is None or rank < 1:
            return Response({"error": "Missing or invalid data provided."}, status=400)

        try:
            with transaction.atomic():
                # Fetch the workflow
                workflow = Workflow.objects.get(id=workflow_id)

                # Create the new column
                new_column = Column.objects.create(name=column_name)

                # Fetch all ColumnWorkflow instances in the same workflow ordered by their current ranks
                all_column_workflows = ColumnWorkflow.objects.filter(workflow=workflow).order_by(
                    "rank"
                )

                # Initialize list for updated ranks
                new_ranks = []
                inserted = False
                current_rank = 1

                # Iterate through all columns and reassign ranks
                for column_workflow in all_column_workflows:
                    if current_rank == rank and not inserted:
                        # Insert the new column at the specified rank
                        new_ranks.append((new_column, rank))
                        inserted = True
                        current_rank += 1

                    new_ranks.append((column_workflow.column, current_rank))
                    current_rank += 1

                # If the new column should be last
                if not inserted:
                    new_ranks.append((new_column, rank))

                # Update ranks for all involved columns and create ColumnWorkflow link
                for column, new_rank in new_ranks:
                    ColumnWorkflow.objects.update_or_create(
                        column=column, workflow=workflow, defaults={"rank": new_rank}
                    )

                return Response(
                    {"message": "New column created and ordered successfully."}, status=201
                )

        except Workflow.DoesNotExist:
            return Response({"error": "Workflow not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @staticmethod
    @api_view(["POST"])
    def update_position(request, pk):
        """
        Changes the rank of a column within its current workflow.

        :param request: HTTP request object containing the new 'rank'.
        :param pk: Primary key of the column whose rank is to be changed.
        :return: HTTP response with success or error message.
        """
        body = request.data
        new_rank = body.get("rank")

        if new_rank is None or new_rank < 1:
            return Response({"error": "Invalid rank provided."}, status=400)

        try:
            with transaction.atomic():
                # Fetch the column workflow relationship for the column
                column_workflow = ColumnWorkflow.objects.select_related("column", "workflow").get(
                    column__id=pk
                )
                workflow = column_workflow.workflow

                # Fetch all ColumnWorkflows in the same workflow ordered by their current ranks
                all_columns = ColumnWorkflow.objects.filter(workflow=workflow).order_by("rank")

                # Initialize list for updated ranks
                new_ranks = []
                inserted = False
                current_rank = 1

                # Iterate through all columns and reassign ranks
                for current_column_workflow in all_columns:
                    if current_rank == new_rank and not inserted:
                        # Insert the target column at the new rank
                        new_ranks.append((column_workflow, new_rank))
                        inserted = True
                        current_rank += 1  # Increment to accommodate the new rank insertion

                    if current_column_workflow != column_workflow:
                        new_ranks.append((current_column_workflow, current_rank))
                        current_rank += 1

                # If not yet inserted (e.g., should be last)
                if not inserted:
                    new_ranks.append((column_workflow, new_rank))

                # Update ranks for all involved columns
                for column_workflow, rank in new_ranks:
                    column_workflow.rank = rank
                    column_workflow.save()

                return Response({"message": "Column rank updated successfully."}, status=200)

        except ColumnWorkflow.DoesNotExist:
            return Response({"error": "Column not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @staticmethod
    @api_view(["DELETE"])
    def delete(request, pk):
        """
        Deletes a column and its associated nodes. Also re-ranks the remaining columns within the same workflow.

        :param request: HTTP request object.
        :param pk: Primary key of the column to be deleted.
        :return: HTTP response with success or error message.
        """
        try:
            with transaction.atomic():
                # Retrieve the column and ensure it exists
                column = Column.objects.get(id=pk)
                workflow_id = column.workflow_id

                # Retrieve and delete all nodes associated with this column
                nodes_to_delete = Node.objects.filter(column_id=column.id)
                nodes_to_delete.delete()

                # Delete the column
                column.delete()

                # Re-rank remaining columns in the workflow
                remaining_columns = ColumnWorkflow.objects.filter(workflow_id=workflow_id).order_by(
                    "rank"
                )
                rank = 1
                for remaining_column_workflow in remaining_columns:
                    remaining_column_workflow.rank = rank
                    remaining_column_workflow.save()
                    rank += 1

                return Response(
                    {"message": "Column and associated nodes deleted successfully, ranks updated."},
                    status=200,
                )

        except Column.DoesNotExist:
            return Response({"error": "Column not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
