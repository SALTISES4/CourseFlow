from functools import wraps, partial
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.conf import settings
import json
from .models import (
    User,
    Course,
    Preparation,
    Activity,
    Assesment,
    Artifact,
    Strategy,
    Node,
    Week,
    Program,
)


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


def is_owner(*args):
    @wraps
    def wrapped_view(fct, model=None):
        def _wrapped_view(request, *args, **kwargs):
            if model:
                if model[-2:] == "Pk":
                    id = json.loads(request.POST.get(model[:-2]))
                    model = model[-2:]
                else:
                    id = json.loads(request.POST.get("json"))["id"]
            else:
                id = json.loads(request.POST.get("objectID"))
                model = json.loads(request.POST.get("objectType"))
            try:
                if model == "node":
                    object = Node.objects.get(id=id)
                elif model == "strategy":
                    object = Strategy.objects.get(id=id)
                elif model == "activity":
                    object = Activity.objects.get(id=id)
                elif model == "assesment":
                    object = Assesment.objects.get(id=id)
                elif model == "artifact":
                    object = Artifact.objects.get(id=id)
                elif model == "preparation":
                    object = Preparation.objects.get(id=id)
                elif model == "week":
                    object = Week.objects.get(id=id)
                elif model == "course":
                    object = Course.objects.get(id=id)
                elif model == "program":
                    object = Program.objects.get(id=id)
            except:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 401
                return response
            if get_object_or_404(User, user=request.user) == object.author:
                return fct(request, *args, **kwargs)
            else:
                response = JsonResponse({"login_url": settings.LOGIN_URL})
                response.status_code = 401
                return response

        return _wrapped_view

    if len(args) == 1 and callable(args[0]):
        return wrapped_view(args[0])
    else:
        return partial(wrapped_view, model=args[1])
