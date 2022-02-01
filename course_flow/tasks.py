from smtplib import SMTPException

import pandas as pd
from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMessage
from django.utils import timezone
from django.utils.translation import gettext as _

from course_flow import export_functions, import_functions
from course_flow import redux_actions as actions

from .celery import try_async
from .models import User
from .utils import dateTimeFormatNoSpace, get_model_from_str


@try_async
@shared_task
def async_send_export_email(
    user_email, pk, object_type, task_type, email_subject, email_text
):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    if task_type == "outcomes_excel":
        file = export_functions.get_outcomes_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "outcomes_csv":
        file = export_functions.get_outcomes_csv(model_object, object_type)
        file_type = "csv"
    elif task_type == "frameworks_excel":
        file = export_functions.get_course_frameworks_excel(
            model_object, object_type
        )
        file_type = "xlsx"
    elif task_type == "matrix_excel":
        file = export_functions.get_program_matrix_excel(
            model_object, object_type
        )
        file_type = "xlsx"
    elif task_type == "matrix_csv":
        file = export_functions.get_program_matrix_csv(
            model_object, object_type
        )
        file_type = "csv"
    elif task_type == "nodes_excel":
        file = export_functions.get_nodes_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "nodes_csv":
        file = export_functions.get_nodes_csv(model_object, object_type)
        file_type = "csv"
    filename = (
        object_type
        + "_"
        + str(pk)
        + "_"
        + timezone.now().strftime(dateTimeFormatNoSpace())
        + "."
        + file_type
    )
    email = EmailMessage(
        email_subject, email_text, settings.DEFAULT_FROM_EMAIL, [user_email],
    )
    if file_type == "csv":
        file_data = "text/csv"
    elif file_type == "xlsx":
        file_data = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    email.attach(
        filename, file, file_data,
    )
    try:
        email.send()
    except SMTPException:
        print("Email could not be sent")


@try_async
@shared_task
def async_import_file_data(pk, object_type, task_type, file_json, user_id):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    user = User.objects.get(pk=user_id)
    actions.dispatch_wf(
        model_object,
        actions.changeField(pk, "workflow", {"importing": True}, False),
    )
    print(task_type)
    cache.set(object_type + str(pk) + "importing", True, 300)
    df = pd.read_json(file_json)
    # try:
    if task_type == "outcomes":
        import_functions.import_outcomes(df, model_object, user)
    if task_type == "nodes":
        import_functions.import_nodes(df, model_object, user)
    #    except:
    #        pass
    cache.delete(object_type + str(pk) + "importing")
    if object_type == "workflow":
        actions.dispatch_wf(
            model_object,
            actions.changeField(pk, "workflow", {"importing": False}, False),
        )
    print("Completed")
