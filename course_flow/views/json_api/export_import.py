import json

import pandas as pd
from django.core.exceptions import ValidationError
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext as _

from course_flow import tasks
from course_flow.decorators import user_can_edit, user_can_view

######################################
# Export and import API, actual logic
# handled in import_functions.py and
# export_functions.py
######################################


@user_can_edit(False)
def json_api_post_import_data(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    object_id = body.get("objectID")
    object_type = body.get("objectType")
    task_type = body.get("importType")
    file = request.FILES.get("myFile")
    try:
        if file.size < 1024 * 1024:
            file_type = file.content_type
            if file.name.endswith(".csv"):
                file_type = "text/csv"
            if (
                file_type
                == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                or file_type == "application/vnd.ms-excel"
            ):
                df = pd.read_excel(file, keep_default_na=False)
            elif file_type == "text/csv":
                df = pd.read_csv(file, keep_default_na=False)
            if len(df.index) > 1000:
                raise ValidationError
            tasks.async_import_file_data(
                object_id,
                object_type,
                task_type,
                df.to_json(),
                request.user.id,
            )
        else:
            return JsonResponse({"action": "error"})
    except Exception:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


@user_can_view(False)
def json_api_post_get_export(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    object_id = body.get("objectID")
    object_type = body.get("objectType")
    export_type = body.get("exportType")
    export_format = body.get("exportFormat")
    allowed_sets = body.get("objectSets", [])
    try:
        subject = _("Your CourseFlow Export")
        text = _("Hi there! Here are the results of your recent export.")
        tasks.async_send_export_email(
            request.user.email,
            object_id,
            object_type,
            export_type,
            export_format,
            allowed_sets,
            subject,
            text,
        )

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})
