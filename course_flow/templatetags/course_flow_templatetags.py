from django import template
from django.conf import settings
from django.urls import reverse

register = template.Library()

@register.simple_tag
def course_flow_return_url():
    if(not hasattr(settings,"COURSE_FLOW_RETURN_URL")):return reverse("course_flow:home")
    return reverse(settings.COURSE_FLOW_RETURN_URL.get("name","course_flow:home"))

@register.simple_tag
def course_flow_return_title():
    if(not hasattr(settings,"COURSE_FLOW_RETURN_URL")):return "Return Home"
    return settings.COURSE_FLOW_RETURN_URL.get("title","Return Home")