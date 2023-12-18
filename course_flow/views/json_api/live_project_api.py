import json

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.utils.translation import gettext as _

from course_flow.decorators import (
    user_can_view,
    user_can_view_or_enrolled_as_teacher,
    user_enrolled_as_student,
    user_enrolled_as_teacher,
    user_is_author,
)
from course_flow.models import (
    LiveAssignment,
    LiveProject,
    LiveProjectUser,
    Node,
    Project,
    User,
    UserAssignment,
    Workflow,
)
from course_flow.serializers import (
    InfoBoxSerializer,
    LiveAssignmentSerializer,
    LiveAssignmentWithCompletionSerializer,
    LiveProjectSerializer,
    LiveProjectUserSerializer,
    LiveProjectUserSerializerWithCompletion,
    UserAssignmentSerializer,
    UserAssignmentSerializerWithUser,
    UserSerializer,
    WorkflowSerializerForAssignments,
    serializer_lookups_shallow,
)
from course_flow.utils import (
    get_model_from_str,
    get_user_role,
    save_serializer,
)

####################################################
# The live project or "Classrooms" api.
####################################################


@user_is_author("projectPk")
def json_api_post_make_project_live(request: HttpRequest) -> JsonResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        liveproject = LiveProject.objects.create(project=project)
        LiveProjectUser.objects.create(
            liveproject=liveproject,
            user=request.user,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
        }
    )


@user_enrolled_as_student("liveprojectPk")
def json_api_post_get_live_project_data_student(
    request: HttpRequest,
) -> JsonResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "overview":
            data_package = {
                "workflows": InfoBoxSerializer(
                    liveproject.visible_workflows.filter(deleted=False),
                    many=True,
                    context={"user": request.user},
                ).data,
                "assignments": LiveAssignmentSerializer(
                    LiveAssignment.objects.filter(
                        userassignment__user=request.user,
                        liveproject=liveproject,
                    ).order_by("end_date"),
                    many=True,
                    context={"user": request.user},
                ).data,
            }
        elif data_type == "assignments":
            assignments = liveproject.liveassignment_set.filter(
                userassignment__user=request.user
            )
            assignments_upcoming = assignments.filter(
                end_date__gt=timezone.now()
            ).order_by("end_date")
            assignments_past = assignments.filter(
                end_date__lte=timezone.now()
            ).order_by("-end_date")

            data_package = {
                "assignments_upcoming": LiveAssignmentSerializer(
                    assignments_upcoming,
                    many=True,
                    context={"user": request.user},
                ).data,
                "assignments_past": LiveAssignmentSerializer(
                    assignments_past,
                    many=True,
                    context={"user": request.user},
                ).data,
            }
        elif data_type == "workflows":
            workflows_added = InfoBoxSerializer(
                liveproject.visible_workflows.filter(deleted=False),
                many=True,
                context={"user": request.user},
            ).data
            data_package = {
                "workflows_added": workflows_added,
            }
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_teacher("liveprojectPk")
def json_api_post_get_live_project_data(request: HttpRequest) -> JsonResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "overview":
            data_package = {
                "workflows": InfoBoxSerializer(
                    liveproject.visible_workflows.filter(deleted=False),
                    many=True,
                    context={"user": request.user},
                ).data,
                "students": LiveProjectUserSerializerWithCompletion(
                    LiveProjectUser.objects.filter(
                        liveproject=liveproject,
                        role_type=LiveProjectUser.ROLE_STUDENT,
                    ),
                    many=True,
                ).data,
                "teachers": LiveProjectUserSerializerWithCompletion(
                    LiveProjectUser.objects.filter(
                        liveproject=liveproject,
                        role_type=LiveProjectUser.ROLE_TEACHER,
                    ),
                    many=True,
                ).data,
                "assignments": LiveAssignmentWithCompletionSerializer(
                    LiveAssignment.objects.filter(
                        liveproject=liveproject
                    ).order_by("end_date"),
                    many=True,
                ).data,
            }
        elif data_type == "completion_table":
            assignments = LiveAssignment.objects.filter(
                liveproject=liveproject
            ).order_by("end_date")
            users = (
                LiveProjectUser.objects.filter(liveproject=liveproject)
                .exclude(role_type=LiveProjectUser.ROLE_NONE)
                .order_by("-role_type")
            )

            table_rows = [
                {
                    "user": UserSerializer(user.user).data,
                    "assignments": UserAssignmentSerializer(
                        UserAssignment.objects.filter(
                            user=user.user, assignment__liveproject=liveproject
                        ),
                        many=True,
                    ).data,
                }
                for user in users
            ]
            data_package = {
                "table_rows": table_rows,
                "assignments": LiveAssignmentWithCompletionSerializer(
                    assignments, many=True
                ).data,
            }
        elif data_type == "students":
            data_package = {
                "liveproject": LiveProjectSerializer(
                    liveproject, context={"user": request.user}
                ).data
            }
        elif data_type == "assignments":
            data_package = {
                "workflows": InfoBoxSerializer(
                    liveproject.visible_workflows.filter(deleted=False),
                    many=True,
                    context={"user": request.user},
                ).data,
                "assignments": LiveAssignmentSerializer(
                    liveproject.liveassignment_set.all(),
                    many=True,
                    context={"user": request.user},
                ).data,
            }
        elif data_type == "workflows":
            workflows_added = InfoBoxSerializer(
                liveproject.visible_workflows.filter(deleted=False),
                many=True,
                context={"user": request.user},
            ).data
            workflows_not_added = InfoBoxSerializer(
                Workflow.objects.filter(
                    project=liveproject.project, deleted=False
                ).exclude(
                    pk__in=[x.pk for x in liveproject.visible_workflows.all()]
                ),
                many=True,
                context={"user": request.user},
            ).data
            data_package = {
                "workflows_added": workflows_added,
                "workflows_not_added": workflows_not_added,
            }
        elif data_type == "settings":
            data_package = {
                "liveproject": LiveProjectSerializer(
                    liveproject, context={"user": request.user}
                ).data
            }
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_teacher("liveprojectPk")
@user_can_view_or_enrolled_as_teacher("nodePk")
def json_api_post_create_live_assignment(request: HttpRequest) -> JsonResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    if node.get_workflow().get_project() != liveproject.project:
        return JsonResponse({"action": "error"})
    try:
        assignment = LiveAssignment.objects.create(
            liveproject=liveproject,
            task=node,
            author=request.user,
        )
        # if liveproject.default_assign_to_all:
        #     students = LiveProjectUser.objects.filter(
        #         liveproject=liveproject, role_type=LiveProjectUser.ROLE_STUDENT
        #     )
        #     for student in students:
        #         UserAssignment.objects.create(
        #             user=student.user, assignment=assignment
        #         )

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "assignmentPk": assignment.pk})


@user_enrolled_as_student("liveassignmentPk")
def json_api_post_get_assignment_data_student(
    request: HttpRequest,
) -> JsonResponse:
    liveassignment = LiveAssignment.objects.get(
        pk=request.POST.get("liveassignmentPk")
    )
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "overview":
            data_package = {"data": liveassignment.id}
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_teacher("liveassignmentPk")
def json_api_post_get_assignment_data(request: HttpRequest) -> JsonResponse:
    liveassignment = LiveAssignment.objects.get(
        pk=request.POST.get("liveassignmentPk")
    )
    liveproject = liveassignment.liveproject
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "edit":
            assigned_users = LiveProjectUserSerializer(
                LiveProjectUser.objects.filter(
                    liveproject=liveproject,
                    user__userassignment__assignment=liveassignment,
                ).exclude(role_type=LiveProjectUser.ROLE_NONE),
                many=True,
            ).data
            other_users = LiveProjectUserSerializer(
                LiveProjectUser.objects.filter(liveproject=liveproject)
                .exclude(
                    role_type=LiveProjectUser.ROLE_NONE,
                )
                .exclude(user__userassignment__assignment=liveassignment),
                many=True,
            ).data

            node_workflow = liveassignment.task.get_workflow()
            parent_workflow = InfoBoxSerializer(
                node_workflow,
                context={"user": request.user},
            ).data
            data_package = {
                "assigned_users": assigned_users,
                "other_users": other_users,
                "parent_workflow": parent_workflow,
            }
        elif data_type == "report":
            userassignments = UserAssignment.objects.filter(
                assignment=liveassignment
            )
            data_package = {
                "userassignments": UserAssignmentSerializerWithUser(
                    userassignments, many=True
                ).data
            }
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_can_view("workflowPk")
def json_api_post_get_workflow_nodes(request: HttpRequest) -> JsonResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = WorkflowSerializerForAssignments(workflow).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_student("nodePk")
def json_api_post_get_assignments_for_node(
    request: HttpRequest,
) -> JsonResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        user = request.user
        workflow = node.get_workflow()
        role_type = get_user_role(workflow, user)
        my_assignments = LiveAssignmentSerializer(
            LiveAssignment.objects.filter(
                task=node, userassignment__user=user
            ),
            many=True,
            context={"user": user},
        ).data
        if role_type == LiveProjectUser.ROLE_TEACHER:
            all_assignments = LiveAssignmentWithCompletionSerializer(
                LiveAssignment.objects.filter(task=node),
                many=True,
            ).data
        else:
            all_assignments = None
        data_package = {
            "my_assignments": my_assignments,
            "all_assignments": all_assignments,
        }
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


# change role on a liveproject for a user
@user_enrolled_as_teacher("liveprojectPk")
def json_api_post_set_liveproject_role(request: HttpRequest) -> JsonResponse:
    user_id = json.loads(request.POST.get("permission_user"))
    liveprojectPk = json.loads(request.POST.get("liveprojectPk"))
    role_type = json.loads(request.POST.get("role_type"))
    response = {}
    try:
        user = User.objects.get(id=user_id)
        liveproject = LiveProject.objects.get(pk=liveprojectPk)
        if liveproject.project.author == user:
            response = JsonResponse(
                {
                    "action": "error",
                    "error": _("This user's role cannot be changed."),
                }
            )
            # response.status_code = 403
            return response
        if (
            role_type == LiveProjectUser.ROLE_TEACHER
            and Group.objects.get(name=settings.TEACHER_GROUP)
            not in user.groups.all()
        ):
            response = JsonResponse(
                {
                    "action": "error",
                    "error": _(
                        "This user has a student account, and cannot be made a teacher."
                    ),
                }
            )
            # response.status_code = 403
            return response

        LiveProjectUser.objects.create(
            liveproject=liveproject, user=user, role_type=role_type
        )
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"
        response.status_code = 401

    return JsonResponse(response)


# add or remove users from assignment
@user_enrolled_as_teacher("liveassignmentPk")
def json_api_post_add_users_to_assignment(
    request: HttpRequest,
) -> JsonResponse:
    user_list = json.loads(request.POST.get("user_list"))
    liveassignmentPk = json.loads(request.POST.get("liveassignmentPk"))
    add = json.loads(request.POST.get("add"))
    try:
        users = User.objects.filter(id__in=user_list)
        assignment = LiveAssignment.objects.get(pk=liveassignmentPk)
        liveproject = assignment.liveproject
        for user in users:
            if (
                LiveProjectUser.objects.filter(
                    user=user, liveproject=liveproject
                )
                .exclude(role_type=LiveProjectUser.ROLE_NONE)
                .count()
                > 0
            ):
                if add:
                    if (
                        UserAssignment.objects.filter(
                            user=user, assignment=assignment
                        ).count()
                        == 0
                    ):
                        UserAssignment.objects.create(
                            user=user, assignment=assignment
                        )
                else:
                    UserAssignment.objects.filter(
                        user=user, assignment=assignment
                    ).delete()

    except ValidationError:
        response = JsonResponse({"action": "error"})
        response.status_code = 401
        return response

    return JsonResponse({"action": "posted"})


# get the list of enrolled users for a project
@user_enrolled_as_teacher("liveprojectPk")
def json_api_post_get_users_for_liveproject(
    request: HttpRequest,
) -> JsonResponse:
    object_id = json.loads(request.POST.get("liveprojectPk"))
    try:
        liveproject = LiveProject.objects.get(pk=object_id)
        teachers = User.objects.filter(
            liveprojectuser__liveproject=liveproject,
            liveprojectuser__role_type=LiveProjectUser.ROLE_TEACHER,
        )
        students = User.objects.filter(
            liveprojectuser__liveproject=liveproject,
            liveprojectuser__role_type=LiveProjectUser.ROLE_STUDENT,
        )

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "author": UserSerializer(liveproject.project.author).data,
            "teachers": UserSerializer(teachers, many=True).data,
            "students": UserSerializer(students, many=True).data,
        }
    )


@user_enrolled_as_teacher("liveprojectPk")
@user_can_view("workflowPk")
def json_api_post_set_workflow_visibility(
    request: HttpRequest,
) -> JsonResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    visible = json.loads(request.POST.get("visible"))
    try:
        if workflow.get_project().liveproject != liveproject:
            raise AttributeError
        count = liveproject.visible_workflows.filter(pk=workflow.pk).count()
        if visible and count == 0:
            liveproject.visible_workflows.add(workflow)
        elif not visible and count > 0:
            liveproject.visible_workflows.remove(workflow)
    except AttributeError:
        response = JsonResponse({"action": "error"})
        response.status_code = 403
        return response
    return JsonResponse(
        {
            "action": "posted",
        }
    )


# Updates an object's information using its serializer
@user_enrolled_as_teacher(False)
def json_api_post_update_liveproject_value(
    request: HttpRequest,
) -> JsonResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        data = json.loads(request.POST.get("data"))
        changeFieldID = request.POST.get("changeFieldID", False)
        if changeFieldID:
            changeFieldID = json.loads(changeFieldID)
        objects = get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            object_to_update = objects.get_subclass(pk=object_id)
        else:
            object_to_update = objects.get(pk=object_id)
        serializer = serializer_lookups_shallow[object_type](
            object_to_update, data=data, partial=True
        )
        save_serializer(serializer)
    except ValidationError:
        return JsonResponse({"action": "error"})
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


# sets the completion on a userassignment object
@user_enrolled_as_student("userassignmentPk")
def json_api_post_set_assignment_completion(
    request: HttpRequest,
) -> JsonResponse:
    try:
        userassignment = UserAssignment.objects.get(
            id=json.loads(request.POST.get("userassignmentPk"))
        )
        completed = json.loads(request.POST.get("completed"))
        if (
            userassignment.user != request.user
            or not userassignment.assignment.self_reporting
        ):
            if (
                LiveProjectUser.objects.filter(
                    liveproject=userassignment.get_live_project(),
                    user=request.user,
                    role_type=LiveProjectUser.ROLE_TEACHER,
                ).count()
                == 0
            ):
                response = JsonResponse({"action": "error"})
                response.status_code = 403
                return response
        userassignment.completed = completed
        userassignment.completed_on = timezone.now()
        userassignment.save()
    except ValidationError:
        response = JsonResponse({"action": "error"})
        response.status_code = 403
        return response
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})
