# import pytest
# from course_flow import decorators
from django.http import HttpResponse


def default_view(request):
    return HttpResponse("OK")


def test_is_owner():
    # wrapped_view = decorators.is_owner("")(default_view)
    # request = HttpRequest()
    # response = wrapped_view(request)
    #
    # assert isinstance(response, HttpResponse)
    pass
