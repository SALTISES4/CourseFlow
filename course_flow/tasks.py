from smtplib import SMTPException

from celery import shared_task
from course_flow import export_functions
from course_flow import import_functions
from course_flow import redux_actions as actions
from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMessage
from django.utils import timezone
from django.utils.translation import gettext as _
import pandas as pd

from .celery import try_async
from .utils import (
    dateTimeFormatNoSpace,
    get_model_from_str,
)
from .models import (
    User
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
def async_import_file_data(pk, object_type, task_type, file_json, user_id):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    user = User.objects.get(pk=user_id)
    actions.dispatch_wf(
        model_object,
        actions.changeField(pk,"workflow",{"importing":True},False)
    )
    print(task_type)
    cache.set(object_type+str(pk)+"importing",True,300)
    df = pd.read_json(file_json)
    try:
        if task_type=="outcomes":
            import_functions.import_outcomes(df,model_object,user)
    except:
        pass
    cache.delete(object_type+str(pk)+"importing")
    if object_type=="workflow":
        actions.dispatch_wf(
            model_object,
            actions.changeField(pk,"workflow",{"importing":False},False)
        )
    print("Completed")