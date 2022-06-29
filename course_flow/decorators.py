import json
from functools import reduce, wraps

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.db.models import Q
from django.http import (
    HttpResponseBadRequest,
    HttpResponseNotFound,
    JsonResponse,
)
from django.views.decorators.http import require_POST

from course_flow.models import ObjectPermission, OutcomeWorkflow, User

from .utils import *


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


def check_object_permission(instance, user, permission):
    if hasattr(instance, "get_subclass"):
        instance = instance.get_subclass()
    if instance.author == user:
        return True
    if permission == ObjectPermission.PERMISSION_VIEW:
        if instance.published == True:
            return True
        permission_check = (
            Q(permission_type=ObjectPermission.PERMISSION_EDIT)
            | Q(permission_type=ObjectPermission.PERMISSION_VIEW)
            | Q(permission_type=ObjectPermission.PERMISSION_COMMENT)
        )
    elif permission == ObjectPermission.PERMISSION_COMMENT:
        permission_check = Q(
            permission_type=ObjectPermission.PERMISSION_EDIT
        ) | Q(permission_type=ObjectPermission.PERMISSION_COMMENT)
    else:
        permission_check = Q(permission_type=permission)
    if (
        ObjectPermission.objects.filter(
            user=user,
            object_id=instance.id,
            content_type=ContentType.objects.get_for_model(instance),
        )
        .filter(permission_check)
        .count()
        > 0
    ):
        return True


def check_objects_permission(instances, user, permission):
    object_permissions = [
        check_object_permission(x, user, permission) for x in instances
    ]
    return reduce(lambda a, b: a | b, object_permissions)


def check_special_case_delete_permission(model_data, user):
    instance = get_model_from_str(model_data["model"]).objects.get(
        id=model_data["id"]
    )
    #    if (
    #        model_data["model"] == "outcome"
    #        and OutcomeWorkflow.objects.filter(outcome=instance).count() == 0
    #    ):
    #        permission_objects = instance.get_permission_objects()
    #        return check_objects_permission(
    #            permission_objects, user, ObjectPermission.PERMISSION_EDIT
    #        )
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
            request_data = request.POST.get(model)
            if request_data is None:
                id = None
            else:
                id = json.loads(request.POST.get(model))
            model = model[:-2]
    else:
        get_parent = kwargs.get("get_parent", False)
        if get_parent:
            request_data = request.POST.get("parentID")
            if request_data is None:
                id = None
                model = None
            else:
                id = json.loads(request_data)
                model = json.loads(request.POST.get("parentType"))
        else:
            request_data = request.POST.get("objectID")
            if request_data is None:
                id = None
                model = None
            else:
                id = json.loads(request_data)
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
                if check_objects_permission(
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
            if check_objects_permission(
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
            if check_objects_permission(
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


def user_can_edit_or_none(model, **outer_kwargs):
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
            if check_objects_permission(
                permission_objects,
                User.objects.get(id=request.user.id),
                ObjectPermission.PERMISSION_EDIT,
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
    "project",
]


def user_can_comment(model, **outer_kwargs):
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
            if check_objects_permission(
                permission_objects,
                User.objects.get(id=request.user.id),
                ObjectPermission.PERMISSION_COMMENT,
            ):
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


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
                    try:
                        perm = check_special_case_delete_permission(
                            model_data, User.objects.get(id=request.user.id)
                        )
                    except Exception as e:
                        response = JsonResponse({"error": str(e)})
                        response.status_code = 400
                        return response
                    if perm:
                        return fct(request, *args, **kwargs)
                else:
                    permission_objects = get_permission_objects(
                        model, request, **outer_kwargs
                    )
                    if check_objects_permission(
                        permission_objects,
                        User.objects.get(id=request.user.id),
                        ObjectPermission.PERMISSION_EDIT,
                    ):
                        return fct(request, *args, **kwargs)

                response = JsonResponse({"error": "permission"})
                response.status_code = 403
                return response
            except Exception as e:
                response = JsonResponse({"error": str(e)})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view

#check to see if the two models are from the same workflow. The second object may be parent if kwargs are used
#The second argument can be optional; if no model info is found the decorator passes
def from_same_workflow(model1,model2, **outer_kwargs):
    def wrapped_view(fct):
        @wraps(fct)
        def _wrapped_view(
            request, model1=model1, model2=model2, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                model_data1 = get_model_from_request(
                    model1, request,
                )
                model_data2 = get_model_from_request(
                    model2, request, **outer_kwargs
                )
                if model_data2["id"] is None or model_data2["id"] == -1:
                    return fct(request, *args, **kwargs)
                instance1 = get_model_from_str(model_data1["model"]).objects.get(
                    id=model_data1["id"]
                )
                instance2 = get_model_from_str(model_data2["model"]).objects.get(
                    id=model_data2["id"]
                )
                if(instance1.get_workflow().id==instance2.get_workflow().id):
                    return fct(request, *args, **kwargs)
                response = JsonResponse({"error": "workflow mismatch"})
                response.status_code = 403
                return response
            except Exception as e:
                response = JsonResponse({"error": str(e)})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view

def user_is_teacher():
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
