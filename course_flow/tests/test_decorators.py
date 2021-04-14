import json

import pytest
from course_flow import decorators
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import PermissionDenied
from django.http import HttpRequest, HttpResponseNotAllowed, JsonResponse


def default_view(request):
    return JsonResponse({"status": "OK"})


def test_is_owner__known_model(node, settings, users):
    wrapped_view = decorators.is_owner("nodePk")(default_view)

    # Logged in and owner -> return view
    request = HttpRequest()
    request.method = "POST"
    request.POST = {"nodePk": str(node.pk)}
    request.user = node.author
    response = wrapped_view(request)

    assert isinstance(response, JsonResponse)
    assert response.status_code == 200
    assert json.loads(response.content)["status"] == "OK"

    # Logged in and NOT owner -> return 403
    request.user = users[1]

    with pytest.raises(PermissionDenied):
        response = wrapped_view(request)

    # Not logged in -> return 401
    request.user = AnonymousUser()
    response = wrapped_view(request)

    assert response.status_code == 401
    assert json.loads(response.content)["login_url"] == settings.LOGIN_URL

    # Method other than POST -> return 405
    request.method = "GET"
    request.user = AnonymousUser()  # Make sure require_POST throws first
    response = wrapped_view(request)

    assert response.status_code == 405
    assert isinstance(response, HttpResponseNotAllowed)

    # Logged in and null json -> return 400
    request.method = "POST"
    request.POST = {}
    request.user = node.author
    response = wrapped_view(request)

    assert response.status_code == 400

    # Logged in and missing key -> return 400
    request.method = "POST"
    request.POST = {"missing": "key"}
    request.user = node.author
    response = wrapped_view(request)

    assert response.status_code == 400


def test_is_owner__unknown_model(node):
    wrapped_view = decorators.is_owner("unknownModelPk")(default_view)

    # Logged in -> return 404
    request = HttpRequest()
    request.method = "POST"
    request.POST = {"unknownModelPk": "1"}
    request.user = node.author
    response = wrapped_view(request)

    assert response.status_code == 404


def test_is_owner__False(node):
    wrapped_view = decorators.is_owner(False)(default_view)

    # Logged in -> return view
    request = HttpRequest()
    request.method = "POST"
    request.POST = {"objectID": str(node.pk), "objectType": "node"}
    request.user = node.author
    response = wrapped_view(request)

    assert isinstance(response, JsonResponse)
    assert response.status_code == 200
    assert json.loads(response.content)["status"] == "OK"
