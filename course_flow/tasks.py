from io import BytesIO

import pandas as pd
from celery import shared_task
from django.core.mail import EmailMessage
from django.utils import timezone
from django.utils.translation import gettext as _

from .models import Column, Course, Node, WeekWorkflow
from .serializers import OutcomeExportSerializer
from .utils import (
    dateTimeFormatNoSpace,
    get_all_outcomes_ordered,
    get_all_outcomes_ordered_for_outcome,
    get_model_from_str,
    get_unique_outcomehorizontallinks,
    get_unique_outcomenodes,
)
from .celery import (
    try_async
)
from smtplib import SMTPException


def get_displayed_title(node):
    if node.linked_workflow is not None and node.represents_workflow:
        return node.linked_workflow.title
    else:
        return "" if node.title is None else node.title


def get_str(obj, key):
    s = obj.get(key, "")
    return "" if s is None else s


def stringify(value):
    if value is None:
        return ""
    else:
        return str(value)


def get_framework_line_for_outcome(outcome):
    outcome_serialized = OutcomeExportSerializer(outcome).data
    sub_outcomes = get_all_outcomes_ordered_for_outcome(outcome)
    sub_outcomes_serialized = OutcomeExportSerializer(
        sub_outcomes[1:], many=True
    ).data
    sub_outcomes_entry = "\n".join(
        [
            get_str(sub, "code") + " - " + get_str(sub, "title")
            for sub in sub_outcomes_serialized
        ]
    )
    outcomes_horizontal = [
        och.parent_outcome
        for och in get_unique_outcomehorizontallinks(outcome)
    ]
    outcomes_horizontal_serialized = OutcomeExportSerializer(
        outcomes_horizontal, many=True
    ).data
    outcomes_horizontal_entry = "\n".join(
        [get_str(och, "code") for och in outcomes_horizontal_serialized]
    )
    dict_data = {
        "a": get_str(outcome_serialized, "code")
        + " - "
        + get_str(outcome_serialized, "title"),
        "b": sub_outcomes_entry,
        "c": outcomes_horizontal_entry,
    }
    activities = Node.objects.filter(
        outcomenode__outcome__in=sub_outcomes,
        column__column_type=Column.LESSON,
    ).distinct()
    assessments = Node.objects.filter(
        outcomenode__outcome__in=sub_outcomes,
        column__column_type=Column.ASSESSMENT,
    ).distinct()
    dict_data["e"] = "\n".join(
        [get_displayed_title(activity) for activity in activities]
    )
    dict_data["f"] = "\n".join(
        [get_displayed_title(assessment) for assessment in assessments]
    )
    return dict_data


def get_course_framework(workflow):
    df = pd.DataFrame(columns=["a", "b", "c", "d", "e", "f", "g"])
    df = df.append(
        {
            "a": _("Course Title"),
            "b": workflow.title,
            "c": _("Ponderation Theory/Practical/Individual"),
            "d": str(workflow.ponderation_theory)
            + "/"
            + str(workflow.ponderation_practical)
            + "/"
            + str(workflow.ponderation_individual),
        },
        ignore_index=True,
    )
    df = df.append(
        {
            "a": _("Course Code"),
            "b": workflow.code,
            "c": _("Hours"),
            "d": str(
                workflow.time_general_hours + workflow.time_specific_hours
            ),
            "e": _("Time"),
            "f": stringify(workflow.time_required)
            + " "
            + workflow.get_time_units_display(),
        },
        ignore_index=True,
    )
    df = df.append({"a": _("Ministerial Competencies")}, ignore_index=True)
    df = df.append({"a": _("Competency"), "b": _("Title")}, ignore_index=True)
    nodes = Node.objects.filter(linked_workflow=workflow).distinct()
    parent_outcomes = []
    for node in nodes:
        outcomenodes = get_unique_outcomenodes(node)
        parent_outcomes += OutcomeExportSerializer(
            [ocn.outcome for ocn in outcomenodes], many=True
        ).data
    a = [get_str(outcome, "code") for outcome in parent_outcomes]
    b = [get_str(outcome, "title") for outcome in parent_outcomes]
    df = pd.concat([df, pd.DataFrame({"a": a, "b": b})])
    if len(nodes) > 0:
        df = df.append(
            {
                "a": _("Term"),
                "b": WeekWorkflow.objects.get(week__nodes=nodes[0]).rank + 1,
            },
            ignore_index=True,
        )
        prereqs = Node.objects.filter(
            outgoing_links__target_node__in=nodes
        ).distinct()
        postreqs = Node.objects.filter(
            incoming_links__source_node__in=nodes
        ).distinct()
        if len(prereqs) > 0:
            df = df.append(
                {
                    "a": _("Prerequisites"),
                    "b": [get_displayed_title(req) for req in prereqs].join(
                        ", "
                    ),
                },
                ignore_index=True,
            )
        if len(postreqs) > 0:
            df = df.append(
                {
                    "a": _("Required For"),
                    "b": [get_displayed_title(req) for req in postreqs].join(
                        ", "
                    ),
                },
                ignore_index=True,
            )
    df = df.append(
        {
            "a": _("Course Outcome"),
            "b": _("Sub-Outcomes"),
            "c": _("Competencies"),
            "d": _("Topics & Content"),
            "e": _("Lessons/Activities"),
            "f": _("Assessments"),
        },
        ignore_index=True,
    )
    for outcome in workflow.outcomes.all():
        df = df.append(
            get_framework_line_for_outcome(outcome), ignore_index=True
        )
    return df


def get_workflow_outcomes_table(workflow):
    outcomes = get_all_outcomes_ordered(workflow)
    data = OutcomeExportSerializer(outcomes, many=True).data
    df = pd.DataFrame(
        data, columns=["code", "title", "description", "id", "depth"]
    )
    pd.set_option("display.max_colwidth", None)
    return df

@try_async
@shared_task
def async_get_outcomes_excel(user_email, pk, object_type):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    with BytesIO() as b:
        # Use the StringIO object as the filehandle.
        writer = pd.ExcelWriter(b, engine="openpyxl")
        if object_type == "workflow":
            workflows = [model_object]
        elif object_type == "project":
            workflows = list(model_object.workflows.all())
        for workflow in workflows:
            df = get_workflow_outcomes_table(workflow)
            df.to_excel(
                writer,
                sheet_name=workflow.title + "_" + str(workflow.pk),
                index=False,
            )
            writer.save()
        # Set up the Http response.
        filename = (
            object_type
            + "_"
            + str(pk)
            + "_"
            + timezone.now().strftime(dateTimeFormatNoSpace())
            + ".xlsx"
        )
        email = EmailMessage(
            _("Your Outcomes Export"),
            _("Hi there! Here are the results of your recent outcomes export."),
            "noreply@courseflow.org",
            [user_email],
        )
        email.attach(
            filename,
            b.getvalue(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        try:
            email.send()
        except SMTPException:
            print("Email could not be sent")


#        response = HttpResponse(
#            b.getvalue(),
#            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
#        )
#        response['Content-Disposition'] = 'attachment; filename=%s' % filename
#        return response


@try_async
@shared_task
def async_get_outcomes_csv(user_email, pk, object_type):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    if object_type == "workflow":
        workflows = [model_object]
    elif object_type == "project":
        workflows = list(model_object.workflows.all())
    df = pd.DataFrame(
        {}, columns=["code", "title", "description", "id", "depth"]
    )
    for workflow in workflows:
        df = df.append({"title": workflow.title}, ignore_index=True)
        df = pd.concat([df, get_workflow_outcomes_table(workflow)])
        df = df.append({"title": ""}, ignore_index=True)
    # Set up the Http response.
    filename = (
        object_type
        + "_"
        + str(pk)
        + "_"
        + timezone.now().strftime(dateTimeFormatNoSpace())
        + ".csv"
    )
    email = EmailMessage(
        _("Your Outcomes Export"),
        _("Hi there! Here are the results of your recent outcomes export."),
        "noreply@courseflow.org",
        [user_email],
    )
    with BytesIO() as b:
        df.to_csv(path_or_buf=b, sep=",", index=False)
        email.attach(filename, b.getvalue(), "text/csv")
        
    try:
        email.send()
    except SMTPException:
        print("Email could not be sent")


@try_async
@shared_task
def async_get_course_frameworks_excel(user_email, pk, object_type):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    with BytesIO() as b:
        # Use the StringIO object as the filehandle.
        writer = pd.ExcelWriter(b, engine="openpyxl")
        if object_type == "workflow":
            workflows = [model_object]
        elif object_type == "project":
            workflows = list(Course.objects.filter(project=model_object))
        for workflow in workflows:
            df = get_course_framework(workflow)
            df.to_excel(
                writer,
                sheet_name=workflow.title + "_" + str(workflow.pk),
                index=False,
                header=False,
            )
            writer.save()
        # Set up the Http response.
        filename = (
            "frameworks_"
            + object_type
            + "_"
            + str(pk)
            + "_"
            + timezone.now().strftime(dateTimeFormatNoSpace())
            + ".xlsx"
        )
        email = EmailMessage(
            _("Your Outcomes Export"),
            _("Hi there! Here are the results of your recent outcomes export."),
            "noreply@courseflow.org",
            [user_email],
        )
        email.attach(
            filename,
            b.getvalue(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        try:
            email.send()
        except SMTPException:
            print("Email could not be sent")
