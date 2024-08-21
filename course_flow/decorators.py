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
from django.views.decorators.http import require_GET, require_POST
from ratelimit.decorators import ratelimit

from course_flow.models import User
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.workflow import Workflow
from course_flow.utils import get_model_from_str


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


# Ajax login required view decorator
def ajax_login_as_teacher_required(view_func):
    """
    Decorator for ajax views that checks if a user is logged in and returns
    a 401 status code otherwise.
    """

    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in request.user.groups.all()
        ):
            return view_func(request, *args, **kwargs)
        else:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 401
            return response

    return _wrapped_view


def is_owner(model):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(request, model=model, *args, **kwargs):
            body = json.loads(request.body)
            if model:
                if model[-2:] == "Pk":
                    pk = body.get(model, "")
                    model = model[:-2]
            else:
                pk = body.get("objectID", "")
                model = body.get("objectType", "")

            if not pk or not model:
                return HttpResponseBadRequest()

            try:
                object_type = get_model_from_str(model)
                object = object_type.objects.get(pk=pk)
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
    if isinstance(instance, Workflow):
        instance = Workflow.objects.get(pk=instance.pk)
    object_permission = ObjectPermission.objects.filter(
        user=user,
        object_id=instance.pk,
        content_type=ContentType.objects.get_for_model(instance),
    )
    if instance.author == user:
        if object_permission.count() == 0:
            ObjectPermission.objects.create(
                user=user,
                content_object=instance,
                permission_type=ObjectPermission.PERMISSION_EDIT,
            )
        return True
    if permission == ObjectPermission.PERMISSION_VIEW:
        if instance.published:
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
    if object_permission.filter(permission_check).count() > 0:
        return True


def check_objects_permission(instances, user, permission):
    object_permissions = [
        check_object_permission(x, user, permission) for x in instances
    ]
    return reduce(lambda a, b: a | b, object_permissions)


def check_objects_public(instances):
    object_public = [x.public_view for x in instances]
    return reduce(lambda a, b: a & b, object_public)


def check_special_case_delete_permission(model_data, user):
    instance = get_model_from_str(model_data["model"]).objects.get(
        pk=model_data["pk"]
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
        if instance.get_project() is None:
            return instance.author == user
        return instance.author == user or check_object_permission(
            instance.get_project(), user, ObjectPermission.PERMISSION_EDIT
        )


def get_model_from_request(model, body, **kwargs):
    if model:
        if model[-2:] == "Pk":
            request_data = body.get(model)
            if request_data is None:
                pk = None
            else:
                pk = body.get(model)
            model = model[:-2]
    else:
        get_parent = kwargs.get("get_parent", False)
        if get_parent:
            request_data = body.get("parentID")
            if request_data is None:
                pk = None
                model = None
            else:
                pk = request_data
                model = body.get("parentType")
        else:
            request_data = body.get("objectID")
            if request_data is None:
                pk = None
                model = None
            else:
                pk = request_data
                model = body.get("objectType")
    return {"model": model, "pk": pk}


def get_permission_objects(model, body, **kwargs):
    model_data = get_model_from_request(model, body, **kwargs)
    object_type = get_model_from_str(model_data["model"])
    permission_objects = object_type.objects.get(
        pk=model_data["pk"]
    ).get_permission_objects()
    return permission_objects


def user_is_author(model, **outer_kwargs):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                body = json.loads(request.body)
                permission_objects = get_permission_objects(
                    model, body, **outer_kwargs
                )
                if all(
                    [
                        obj.author == User.objects.get(pk=request.user.pk)
                        for obj in permission_objects
                    ]
                ):
                    return fct(request, *args, **kwargs)
                else:
                    response = JsonResponse({"login_url": settings.LOGIN_URL})
                    response.status_code = 403
                    return response
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def user_can_edit(model, **outer_kwargs):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                if request.content_type == "multipart/form-data":
                    body = json.loads(request.POST["body"])
                else:
                    body = json.loads(request.body)
                permission_objects = get_permission_objects(
                    model, body, **outer_kwargs
                )
                if check_objects_permission(
                    permission_objects,
                    User.objects.get(pk=request.user.pk),
                    ObjectPermission.PERMISSION_EDIT,
                ):
                    return fct(request, *args, **kwargs)
                else:
                    response = JsonResponse({"login_url": settings.LOGIN_URL})
                    response.status_code = 403
                    return response
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def user_can_view(model, **outer_kwargs):
    def wrapped_view(fct):
        @require_POST
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                body = json.loads(request.body)
                permission_objects = get_permission_objects(
                    model, body, **outer_kwargs
                )
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if check_objects_permission(
                permission_objects,
                User.objects.get(pk=request.user.pk),
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
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                body = json.loads(request.body)
                model_data = get_model_from_request(
                    model, body, **outer_kwargs
                )
                if model_data["pk"] is None or model_data["pk"] == -1:
                    return fct(request, *args, **kwargs)
                permission_objects = get_permission_objects(
                    model, body, **outer_kwargs
                )
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if check_objects_permission(
                permission_objects,
                User.objects.get(pk=request.user.pk),
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
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                body = json.loads(request.body)
                model_data = get_model_from_request(
                    model, body, **outer_kwargs
                )
                if model_data["pk"] is None or model_data["pk"] == -1:
                    return fct(request, *args, **kwargs)
                permission_objects = get_permission_objects(
                    model, body, **outer_kwargs
                )
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if check_objects_permission(
                permission_objects,
                User.objects.get(pk=request.user.pk),
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
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                body = json.loads(request.body)
                permission_objects = get_permission_objects(
                    model, body, **outer_kwargs
                )
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if check_objects_permission(
                permission_objects,
                User.objects.get(pk=request.user.pk),
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
        @ajax_login_as_teacher_required
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            try:
                body = json.loads(request.body)
                model_data = get_model_from_request(
                    model, body, **outer_kwargs
                )
                if model_data["model"] in delete_exceptions:
                    try:
                        perm = check_special_case_delete_permission(
                            model_data, User.objects.get(pk=request.user.pk)
                        )
                    except Exception as e:
                        response = JsonResponse({"error": str(e)})
                        response.status_code = 400
                        return response
                    if perm:
                        return fct(request, *args, **kwargs)
                else:
                    permission_objects = get_permission_objects(
                        model, body, **outer_kwargs
                    )
                    if check_objects_permission(
                        permission_objects,
                        User.objects.get(pk=request.user.pk),
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


# check to see if the two models are from the same workflow. The second object may be parent if kwargs are used
# The second argument can be optional; if no model info is found the decorator passes
def from_same_workflow(model1, model2, **outer_kwargs):
    def wrapped_view(fct):
        @wraps(fct)
        def _wrapped_view(
            request,
            model1=model1,
            model2=model2,
            outer_kwargs=outer_kwargs,
            *args,
            **kwargs
        ):
            try:
                body = json.loads(request.body)
                model_data1 = get_model_from_request(
                    model1,
                    body,
                )
                model_data2 = get_model_from_request(
                    model2, body, **outer_kwargs
                )
                if (body.get("allowDifferent", "false")) and not (
                    body.get("columnChange", "false")
                ):
                    return fct(request, *args, **kwargs)
                if model_data2["pk"] is None or model_data2["pk"] == -1:
                    return fct(request, *args, **kwargs)
                instance1 = get_model_from_str(
                    model_data1["model"]
                ).objects.get(pk=model_data1["pk"])
                instance2 = get_model_from_str(
                    model_data2["model"]
                ).objects.get(pk=model_data2["pk"])
                if instance1.get_workflow().pk == instance2.get_workflow().pk:
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
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def public_access(**outer_kwargs):
    rate_per_min = outer_kwargs.get("rate", 5)

    def wrapped_view(fct):
        @require_GET
        @ratelimit(key="ip", rate=str(rate_per_min) + "/m", method=["GET"])
        @wraps(fct)
        def _wrapped_view(request, outer_kwargs=outer_kwargs, *args, **kwargs):
            ratelimited = getattr(request, "limited", False)
            if ratelimited:
                response = JsonResponse({"action": "ratelimited"})
                response.status_code = 429
                return response
            return fct(request, *args, **kwargs)

        return _wrapped_view

    return wrapped_view


# @todo more explanation on this decorator business purpose
def public_model_access(model, **outer_kwargs):
    rate_per_min = outer_kwargs.get("rate", 5)

    def wrapped_view(fct):
        @require_GET
        @ratelimit(key="ip", rate=str(rate_per_min) + "/m", method=["GET"])
        @wraps(fct)
        def _wrapped_view(
            request, model=model, outer_kwargs=outer_kwargs, *args, **kwargs
        ):
            ratelimited = getattr(request, "limited", False)
            if ratelimited:
                response = JsonResponse({"action": "ratelimited"})
                response.status_code = 429
                return response
            try:
                model_type = get_model_from_str(model)
                permission_objects = model_type.objects.get(
                    pk=kwargs.get("pk")
                ).get_permission_objects()
            except AttributeError:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if check_objects_public(permission_objects):
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def ignore_extra_args(view_func):
    @wraps(view_func)
    def _decorated(request, *args, **kwargs):
        # Filter kwargs to only include those accepted by the view function
        func_args = view_func.__code__.co_varnames[
            : view_func.__code__.co_argcount
        ]
        filtered_kwargs = {k: v for k, v in kwargs.items() if k in func_args}
        return view_func(request, **filtered_kwargs)

    return _decorated
