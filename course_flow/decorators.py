import json
from functools import reduce, wraps

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.http import (
    HttpResponseBadRequest,
    HttpResponseNotFound,
    JsonResponse,
)
from django.views.decorators.http import require_POST

from course_flow.models import ObjectPermission, OutcomeProject, User

from .utils import get_model_from_str


# Ajax login required view decorator
def ajax_login_required(view_func):
    """
    Decorator for ajax views that checks if a user is logged in and returns
    a 401 status code otherwise.
    """

    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        else:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 401
            return response

    return _wrapped_view


owned_models = [
    "nodelink",
    "node",
    "week",
    "workflow",
    "project",
    "column",
    "workflow",
    "project",
    "outcome",
    "outcome",
]

owned_throughmodels = [
    "node",
    "nodeweek",
    "week",
    "weekworkflow",
    "workflow",
    "workflowproject",
    "project",
    "columnworkflow",
    "workflow",
    "workflowproject",
    "project",
    "outcome",
    "outcomeoutcome",
    "outcome",
]
program_level_owned_models = ["assessment", "program", "course", "program"]


def is_owner(model):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_required
        @wraps(fct)
        def _wrapped_view(request, model=model, *args, **kwargs):
            if model:
                if model[-2:] == "Pk":
                    id = json.loads(request.POST.get(model, json.dumps("")))
                    model = model[:-2]
            else:
                id = json.loads(request.POST.get("objectID", json.dumps("")))
                model = json.loads(
                    request.POST.get("objectType", json.dumps(""))
                )

            if not id or not model:
                return HttpResponseBadRequest()

            try:
                object_type = get_model_from_str(model)
                if hasattr(object_type.objects, "get_subclass"):
                    object = object_type.objects.get_subclass(id=id)
                else:
                    object = object_type.objects.get(id=id)
            except ObjectDoesNotExist:
                return HttpResponseNotFound()

            # Check ownership
            if request.user == object.author:
                return fct(request, *args, **kwargs)
            else:
                raise PermissionDenied

        return _wrapped_view

    return wrapped_view


def test_object_permission(instance,user,permission):
    if hasattr(instance,"get_subclass"):
        instance = instance.get_subclass()
    if instance.author == user:
        return True
    if permission == ObjectPermission.PERMISSION_VIEW:
        if instance.published == True:
            return True
        if (
            ObjectPermission.objects.filter(
                user=user,
                object_id=instance.id,
                content_type=ContentType.objects.get_for_model(instance),
                permission_type=ObjectPermission.PERMISSION_EDIT,
            ).count()
            > 0
        ):
            return True
    return (
        ObjectPermission.objects.filter(
            user=user,
            object_id=instance.id,
            content_type=ContentType.objects.get_for_model(instance),
            permission_type=permission,
        ).count()
        > 0
    )


def test_objects_permission(instances, user, permission):
    object_permissions = [
        test_object_permission(x, user, permission) for x in instances
    ]
    return reduce(lambda a, b: a | b, object_permissions)


def test_special_case_delete_permission(model_data, user):
    instance = get_model_from_str(model_data["model"]).objects.get(
        id=model_data["id"]
    )
    if (
        model_data["model"] == "outcome"
        and OutcomeProject.objects.filter(outcome=instance).count() == 0
    ):
        permission_objects = instance.get_permission_objects()
        return test_objects_permission(
            permission_objects, user, ObjectPermission.PERMISSION_EDIT
        )
    if model_data["model"] == "project":
        return instance.author == user
    else:
        if hasattr(instance, "get_subclass"):
            instance = instance.get_subclass()
        if instance.get_project() is None:
            return instance.author == user
        return instance.author == user or instance.get_project().author == user


def get_model_from_request(model, request, **kwargs):
    if model:
        if model[-2:] == "Pk":
            id = json.loads(request.POST.get(model))
            model = model[:-2]
        else:
            id = json.loads(request.POST.get("json"))["id"]
    else:
        if "get_parent" in kwargs:
            if kwargs["get_parent"] == True:
                id = json.loads(request.POST.get("parentID"))
                model = json.loads(request.POST.get("parentType"))
        else:
            id = json.loads(request.POST.get("objectID"))
            model = json.loads(request.POST.get("objectType"))
    return {"model": model, "id": id}


def get_permission_objects(model, request, **kwargs):
    model_data = get_model_from_request(model, request, **kwargs)
    object_type = get_model_from_str(model_data["model"])
    permission_objects = object_type.objects.get(
        id=model_data["id"]
    ).get_permission_objects()
    return permission_objects


def user_can_edit(model, **outer_kwargs):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                permission_objects = get_permission_objects(
                    model, request, **outer_kwargs
                )
                if test_objects_permission(
                    permission_objects,
                    User.objects.get(id=request.user.id),
                    ObjectPermission.PERMISSION_EDIT,
                ):
                    return fct(request, *args, **kwargs)
                else:
                    response = JsonResponse({"login_url": settings.LOGIN_URL})
                    response.status_code = 403
                    return response
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def user_can_view(model, **outer_kwargs):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                permission_objects = get_permission_objects(
                    model, request, **outer_kwargs
                )
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if test_objects_permission(
                permission_objects,
                User.objects.get(id=request.user.id),
                ObjectPermission.PERMISSION_VIEW,
            ):
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def user_can_view_or_none(model, **outer_kwargs):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                model_data = get_model_from_request(
                    model, request, **outer_kwargs
                )
                if model_data["id"] is None or model_data["id"] == -1:
                    return fct(request, *args, **kwargs)
                permission_objects = get_permission_objects(
                    model, request, **outer_kwargs
                )
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if test_objects_permission(
                permission_objects,
                User.objects.get(id=request.user.id),
                ObjectPermission.PERMISSION_VIEW,
            ):
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


delete_exceptions = [
    "workflow",
    "activity",
    "course",
    "program",
    "outcome",
    "project",
]


def user_can_delete(model, **outer_kwargs):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                model_data = get_model_from_request(
                    model, request, **outer_kwargs
                )
                if model_data["model"] in delete_exceptions:
                    if test_special_case_delete_permission(
                        model_data, User.objects.get(id=request.user.id)
                    ):
                        return fct(request, *args, **kwargs)
                else:
                    permission_objects = get_permission_objects(
                        model, request, **outer_kwargs
                    )
                    if test_objects_permission(
                        permission_objects,
                        User.objects.get(id=request.user.id),
                        ObjectPermission.PERMISSION_EDIT,
                    ):
                        return fct(request, *args, **kwargs)

                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def user_is_teacher(model):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_required
        @wraps(fct)
        def _wrapped_view(request, *args, **kwargs):
            try:
                if (
                    Group.objects.get(name=settings.TEACHER_GROUP)
                    in request.user.groups.all()
                ):
                    return fct(request, *args, **kwargs)
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view
