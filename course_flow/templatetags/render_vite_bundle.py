# course_flow/templatetags/render_vite_bundle.py
import json

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def render_vite_bundle():
    # Read manifest exactly where you said it is
    manifest_path = f"{settings.VITE_APP_DIR}/dist/.vite/manifest.json"
    try:
        with open(manifest_path, "r", encoding="utf-8") as fd:
            manifest = json.load(fd)
    except Exception:
        raise Exception(
            f"Vite manifest not found or invalid at {manifest_path}. "
            "Did you run `vite build --manifest`?"
        )

    entry = manifest["index.html"]  # tailored to your manifest key
    js_file = entry["file"]  # e.g., assets/index-Crfdf0H1.js
    css_file = entry["css"][0]  # e.g., assets/index-CJ7NE_O5.css

    return mark_safe(
        f'<script type="module" src="/static/{js_file}"></script>\n'
        f'<link rel="stylesheet" href="/static/{css_file}" />'
    )
