from smtplib import SMTPException

import pandas as pd
from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.core.mail import EmailMessage
from django.utils import timezone

from course_flow import export_functions, import_functions
from course_flow import redux_actions as actions

from .celery import logger, try_async
from .models import ObjectSet, User
from .utils import dateTimeFormatNoSpace, get_model_from_str


@try_async
@shared_task
def async_send_export_email(
    user_email,
    pk,
    object_type,
    export_type,
    export_format,
    allowed_sets,
    email_subject,
    email_text,
):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    if object_type == "project":
        project_sets = ObjectSet.objects.filter(project=model_object)
    else:
        project_sets = ObjectSet.objects.filter(
            project=model_object.get_project()
        )
    allowed_sets = project_sets.filter(id__in=allowed_sets)
    if export_type == "outcome":
        file = export_functions.get_outcomes_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "framework":
        file = export_functions.get_course_frameworks_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "matrix":
        file = export_functions.get_program_matrix_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "sobec":
        file = export_functions.get_sobec_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "node":
        file = export_functions.get_nodes_export(
            model_object, object_type, export_format, allowed_sets
        )
    if export_format == "excel":
        file_ext = "xlsx"
    elif export_format == "csv":
        file_ext = "csv"

    filename = (
        object_type
        + "_"
        + str(pk)
        + "_"
        + export_type
        + "_"
        + timezone.now().strftime(dateTimeFormatNoSpace())
        + "."
        + file_ext
    )
    email = EmailMessage(
        email_subject,
        email_text,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
    )
    if export_format == "csv":
        file_data = "text/csv"
    elif export_format == "excel":
        file_data = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    if settings.DEBUG:
        with open("last_export." + file_ext, "wb") as out_file:
            out_file.write(file)

    email.attach(
        filename,
        file,
        file_data,
    )
    try:
        email.send()
        logger.info(
            f"Email - {email_subject} - {filename} - sent to {user_email}"
        )
    except SMTPException:
        logger.info(
            f"Email - {email_subject} - {filename} - could NOT be sent to {user_email}"
        )


@try_async
@shared_task
def async_import_file_data(pk, object_type, task_type, file_json, user_id):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    user = User.objects.get(pk=user_id)
    if object_type == "workflow":
        actions.dispatch_wf(
            model_object,
            actions.changeField(pk, "workflow", {"importing": True}, False),
        )
    cache.set(object_type + str(pk) + "importing", True, 300)
    df = pd.read_json(file_json)
    try:
        if task_type == "outcomes":
            import_functions.import_outcomes(df, model_object, user)
        if task_type == "nodes":
            import_functions.import_nodes(df, model_object, user)
    except Exception:
        pass
    cache.delete(object_type + str(pk) + "importing")
    if object_type == "workflow":
        actions.dispatch_wf(
            model_object,
            actions.changeField(pk, "workflow", {"importing": False}, False),
        )
