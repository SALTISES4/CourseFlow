import json
from functools import wraps

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.http import (
    HttpResponseBadRequest,
    HttpResponseNotFound,
    JsonResponse,
)
from django.views.decorators.http import require_POST

from .models import NodeWeek, Outcome, OutcomeOutcome, User, Week, Workflow
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


def is_owner_or_none(model):
    def wrapped_view(fct):
        @wraps(fct)
        def _wrapped_view(request, model=model, *args, **kwargs):
            if model:
                if model[-2:] == "Pk":
                    id = json.loads(request.POST.get(model))
                    model = model[:-2]
            else:
                id = json.loads(request.POST.get("objectID"))
                model = json.loads(request.POST.get("objectType"))
            if id is None:
                return fct(request, *args, **kwargs)
            try:
                object_type = get_model_from_str(model)
                if hasattr(object_type.objects, "get_subclass"):
                    object = object_type.objects.get_subclass(id=id)
                else:
                    object = object_type.objects.get(id=id)
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if request.user == object.author:
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def is_owner_or_published(model):
    def wrapped_view(fct):
        @wraps(fct)
        def _wrapped_view(request, model=model, *args, **kwargs):
            if model:
                if model[-2:] == "Pk":
                    id = json.loads(request.POST.get(model))
                    model = model[:-2]
            else:
                id = json.loads(request.POST.get("objectID"))
                model = json.loads(request.POST.get("objectType"))
            try:
                object_type = get_model_from_str(model)
                if hasattr(object_type.objects, "get_subclass"):
                    object = object_type.objects.get_subclass(id=id)
                else:
                    object = object_type.objects.get(id=id)
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if (
                request.user == object.author
                or object.published
            ):
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def is_none_or_owner_or_published(model):
    def wrapped_view(fct):
        @wraps(fct)
        def _wrapped_view(request, model=model, *args, **kwargs):
            if model:
                if model[-2:] == "Pk":
                    id = json.loads(request.POST.get(model))
                    model = model[:-2]
            else:
                id = json.loads(request.POST.get("objectID"))
                model = json.loads(request.POST.get("objectType"))
            if id == -1:
                return fct(request, *args, **kwargs)
            try:
                object_type = get_model_from_str(model)
                if hasattr(object_type.objects, "get_subclass"):
                    object = object_type.objects.get_subclass(id=id)
                else:
                    object = object_type.objects.get(id=id)
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
            if (
                request.user == object.author
                or object.published
            ):
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def is_strategy_owner_or_published(model):
    def wrapped_view(fct):
        @wraps(fct)
        def _wrapped_view(request, model=model, *args, **kwargs):
            id = json.loads(request.POST.get(model))
            object = Workflow.objects.get_subclass(id=id)
            if (
                request.user == object.author
                or object.published
            ):
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return _wrapped_view

    return wrapped_view


def is_parent_owner(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        model = json.loads(request.POST.get("objectType"))
        parent_id = json.loads(request.POST.get("parentID"))
        if model in ["activity", "course", "program"]:
            return view_func(request, *args, **kwargs)
        try:
            parentType = get_model_from_str(
                owned_models[owned_models.index(model) + 1]
            )
            if hasattr(parentType.objects, "get_subclass"):
                parent = parentType.objects.get_subclass(id=parent_id)
            else:
                parent = parentType.objects.get(id=parent_id)
        except:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 403
            return response
        if request.user == parent.author:
            return view_func(request, *args, **kwargs)
        else:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 403
            return response

    return _wrapped_view


def is_throughmodel_parent_owner(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        id = json.loads(request.POST.get("objectID"))
        model = json.loads(request.POST.get("objectType"))
        parent_id = json.loads(request.POST.get("parentID"))
        try:
            parentType = get_parent_model(model)

            if hasattr(parentType.objects, "get_subclass"):
                parent = parentType.objects.get_subclass(id=parent_id)
            else:
                parent = parentType.objects.get(id=parent_id)
        except:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 403
            return response
        if request.user == parent.author:
            return view_func(request, *args, **kwargs)
        else:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 403
            return response

    return _wrapped_view


def new_parent_authorship(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if json.loads(request.POST.get("objectType")) == "nodeweek":

            object_id = json.loads(request.POST.get("objectID"))
            parent_id = json.loads(request.POST.get("parentID"))

            old_parent_id = NodeWeek.objects.get(id=object_id).week.id

            if parent_id == old_parent_id:
                return view_func(request, *args, **kwargs)

            parent = Week.objects.get(id=parent_id)

            if hasattr(parent, "get_subclass"):
                parent_author = parent.get_subclass().author
            else:
                parent_author = parent.author

            if request.user != parent_author:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response
        elif json.loads(request.POST.get("objectType")) == "outcomeoutcome":

            object_id = json.loads(request.POST.get("objectID"))
            parent_id = json.loads(request.POST.get("parentID"))

            old_parent_id = OutcomeOutcome.objects.get(id=object_id).parent.id

            if parent_id == old_parent_id:
                return view_func(request, *args, **kwargs)

            parent = Outcome.objects.get(id=parent_id)

            if hasattr(parent, "get_subclass"):
                parent_author = parent.get_subclass().author
            else:
                parent_author = parent.author

            if request.user != parent_author:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 403
                return response

        return view_func(request, *args, **kwargs)

    return _wrapped_view
