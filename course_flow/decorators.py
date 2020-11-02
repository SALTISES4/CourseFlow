from functools import wraps
from django.http import JsonResponse
from django.conf import settings
import json
from .models import User
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


owned_models = ["nodelink", "node", "strategy", "workflow"]
owned_throughmodels = [
    "node",
    "nodestrategy",
    "strategy",
    "strategyworkflow",
    "workflow",
    "columnworkflow",
    "workflow",
]
program_level_owned_models = ["assessment", "program", "course", "program"]


def is_owner(model):
    def wrapped_view(fct):
        @wraps(fct)
        def _wrapped_view(request, model=model, *args, **kwargs):
            if model:
                if model[-2:] == "Pk":
                    id = json.loads(request.POST.get(model))
                    model = model[:-2]
                else:
                    id = json.loads(request.POST.get("json"))["id"]
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
                response.status_code = 401
                return response
            if User.objects.get(id=request.user.id) == object.author:
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 401
                return response

        return _wrapped_view

    return wrapped_view


def is_parent_owner(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        model = json.loads(request.POST.get("objectType"))
        parent_id = json.loads(request.POST.get("parentID"))
        if model == "activity" or model == "course" or model == "program":
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
            response.status_code = 401
            return response
        if User.objects.get(id=request.user.id) == parent.author:
            return view_func(request, *args, **kwargs)
        else:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 401
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
            response.status_code = 401
            return response
        if User.objects.get(id=request.user.id) == parent.author:
            return view_func(request, *args, **kwargs)
        else:
            response = JsonResponse({"login_url": settings.LOGIN_URL})
            response.status_code = 401
            return response

    return _wrapped_view
