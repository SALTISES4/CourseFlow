import logging
from smtplib import SMTPException

import pandas as pd
from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMessage
from django.utils import timezone

from course_flow.models import ObjectSet, User
from course_flow.services import DAO, Utility
from course_flow.services.export_import import Exporter, Importer
from course_flow.sockets import redux_actions as actions
from course_flow.sockets.celery import logger, try_async


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
    model_object = DAO.get_model_from_str(object_type).objects.get(pk=pk)
    exporter = Exporter()

    if object_type == "project":
        project_sets = ObjectSet.objects.filter(project=model_object)
    else:
        project_sets = ObjectSet.objects.filter(
            project=model_object.get_project()
        )
    allowed_sets = project_sets.filter(id__in=allowed_sets)
    if export_type == "outcome":
        file = exporter.get_outcomes_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "framework":
        file = exporter.get_course_frameworks_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "matrix":
        file = exporter.get_program_matrix_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "sobec":
        file = exporter.get_sobec_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "node":
        file = exporter.get_nodes_export(
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
        + timezone.now().strftime(Utility.dateTimeFormatNoSpace())
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
    importer = Importer()

    model_object = DAO.get_model_from_str(object_type).objects.get(pk=pk)
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
            importer.import_outcomes(df, model_object, user)

        if task_type == "nodes":
            importer.import_nodes(df, model_object, user)

    except Exception as e:
        logger.exception("An error occurred")
        pass

    cache.delete(object_type + str(pk) + "importing")

    if object_type == "workflow":
        actions.dispatch_wf(
            model_object,
            actions.changeField(pk, "workflow", {"importing": False}, False),
        )
