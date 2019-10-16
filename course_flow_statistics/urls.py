from django.conf import settings
from django.urls import path

from . import views

from django.conf.urls import include, url


from . import views


def flow_patterns():
    return []


urlpatterns = sum([flow_patterns()], [])
