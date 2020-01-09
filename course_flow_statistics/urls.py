from django.conf import settings
from django.urls import path

from django.conf.urls import include, url


def flow_patterns():
    return []


urlpatterns = sum([flow_patterns()], [])
