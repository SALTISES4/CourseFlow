from smtplib import SMTPException

from celery import shared_task
from course_flow import export_functions
from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone
from django.utils.translation import gettext as _

from .celery import try_async
from .utils import (
    dateTimeFormatNoSpace,
    get_model_from_str,
)


@try_async
@shared_task
def async_send_export_email(user_email, pk, object_type, task_type, email_subject, email_text):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    if task_type == "outcomes_excel":
        file = export_functions.get_outcomes_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "outcomes_csv":
        file = export_functions.get_outcomes_csv(model_object, object_type)
        file_type = "csv"
    elif task_type == "frameworks_excel":
        file = export_functions.get_course_frameworks_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "matrix_excel":
        file = export_functions.get_program_matrix_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "matrix_csv":
        file = export_functions.get_program_matrix_csv(model_object, object_type)
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
        email_subject,
        email_text,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
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
def async_import_file_data(pk, object_type, task_type, file):
    print(file)