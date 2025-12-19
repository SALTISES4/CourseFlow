from io import BytesIO
import time
import traceback
import numpy as np

import pandas as pd
from openpyxl.styles import PatternFill
from django.db.models import Q
from django.utils.translation import gettext as _
from django.utils import timezone

from course_flow import analytics, models

from course_flow.export_functions import allowed_sets_Q

from .models import (
    Course,
    Node,
    Outcome,
    OutcomeNode,
    OutcomeWorkflow,
    Program,
    Week,
    WeekWorkflow,
    Column,
)
from .serializers import (
    NodeExportSerializerForFormatted,
    WeekExportSerializer,
    WorkflowExportSerializer,
    WorkflowExportSerializerWithPonderation,
    ColumnExportSerializer,
)
from .utils import (
    get_alphanum,
    dateTimeFormat,
    benchmark,
)

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def luminance(rgb):
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b


def readable_text_color(bg_hex, threshold=140):
    """
    Returns '#000000' or '#FFFFFF' depending on background brightness.
    """
    lum = luminance(hex_to_rgb(bg_hex))
    return "#000000" if lum > 140 else "#FFFFFF"


def get_workflow_full_table(workflow, allowed_sets):
    entries = []
    for week in Week.objects.filter(workflow=workflow, deleted=False).order_by(
        "weekworkflow__rank"
    ):
        week_serialized = WeekExportSerializer(week).data
        week_serialized["week"]=week_serialized["title"]
        del week_serialized["title"]
        entries += [week_serialized]
        nodes = NodeExportSerializerForFormatted(
            Node.objects.filter(week=week, deleted=False)
            .filter(allowed_sets_Q(allowed_sets))
            .distinct()
            .order_by("nodeweek__rank"),
            many=True,
        ).data
        entries += nodes
    #Create the original dataframe
    df = pd.DataFrame(
        entries, columns=["type", "week","title", "description", "outcomes", "column_order", "id","time_required","time_units_display"]
    )
    #Add the time to the titles
    mask = df["time_required"].notna() & (df["time_required"] != 0)
    sep = np.where(df["time_units_display"].astype(str).str.len() > 0, " ", "")
    df["title"] = df["title"].where(
        ~mask,
        df["title"] + " (" +
        df["time_required"].astype(str) + sep +
        df["time_units_display"] + ")"
    )
    df = df.drop(columns=["time_required","time_units_display"])
    #Since we have weeks and nodes, we'll need a unique id for our objects and we want to preserve this order for later
    df["uid"] = df.index
    df["description"] = df["description"].fillna("\n")
    df["column_order"] = df["column_order"].fillna(-1)
    df["column_order"] = df["column_order"].astype(int)

    #Get the column colour info
    df_col = pd.DataFrame(
        ColumnExportSerializer(
            Column.objects.filter(workflow=workflow, deleted=False).order_by("columnworkflow__rank"),
            many=True
        ).data, 
        columns=["title", "colour"]
    )
    df_col = df_col.rename(columns={"title":"column_title"})
    df_col["column_order"]=df_col.index
    #Merge it into our dataframe
    df = df.merge(df_col,on="column_order",how="left")

    #Pivot our tables to get a sparse array that mimics the column structure of workflows
    wide_title = (
        df[df["type"]=="node"].pivot(index="uid",columns="column_order", values="title")
    )
    wide_title["rowtype"]="a_title"
    wide_description = (
        df[df["type"]=="node"].pivot(index="uid",columns="column_order", values="description")
    )
    wide_description["rowtype"]="b_description"
    #Create a table with titles and descriptions in separate rows
    interleaved = (pd.concat([wide_title,wide_description])
        .reset_index()
    )
    pivoted = df.merge(interleaved, on=["uid"],how="outer").sort_values(["uid","rowtype"])
    pivoted = pivoted.drop(columns=["title","description","column_order","id","uid","column_title"])
    pivoted.loc[pivoted["type"]=="week","rowtype"]="week"

    pivoted.loc[pivoted["rowtype"]=="a_title","outcomes"]=""


    #Add a row at the top for the column
    col_row = df_col.drop(columns=["colour","column_order"]).T
    col_row["week"]=_("Week")
    col_row["outcomes"]=_("Outcomes")
    col_row["rowtype"]=["columns"]

    #Add a few lines for the workflow info
    wf_serialized = WorkflowExportSerializerWithPonderation(workflow).data
    wf_info = [{
        "week":wf_serialized.get("title"),
        "rowtype":"wf_title",
    },{
        "week":_("Description"),
        "outcomes":wf_serialized.get("description"),
        "rowtype":"wf_description",
    },{
        "week":f'{_("Ponderation")} ({_("Theory")}/{_("Practical")}/{_("Individual")})',
        "outcomes": f'{wf_serialized.get("ponderation_theory")}/{wf_serialized.get("ponderation_practical")}/{wf_serialized.get("ponderation_individual")}',
        "rowtype":"wf_ponderation",
    }]

    df_info = pd.DataFrame(wf_info)

    with_columns = pd.concat([df_info,col_row.reset_index(),pivoted]).reindex(columns=pivoted.columns)

    with_columns = with_columns.drop(columns=["type"])

    #move colour to the end
    with_columns["colour"] = with_columns.pop("colour")

    pd.set_option("display.max_colwidth", None)
    return (with_columns.reset_index().drop(columns=["index"]),df_col)



def get_workflows_export(model_object, object_type, export_format, allowed_sets):
    if object_type == "project":
        workflows = list(model_object.workflows.filter(deleted=False))
    else:
        workflows = [model_object]
    with BytesIO() as b:
        if export_format == "excel":
            title_colour = "#04BA74"
            week_colour = "#B7DEE8"
            week_header_colour = "#92CDDC"
            outcome_header_colour = "#B1A0C7"
            with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
                workbook = writer.book 
                wrap_format = workbook.add_format()
                wrap_format.set_text_wrap()
                wrap_format.set_align("top")

                title_format = workbook.add_format({
                    "bg_color": title_colour,
                    "font_color": "#FFFFFF",
                    "font_size": 18,
                    "bold": True,
                    "text_wrap": True,
                    "valign": "top",
                })
                week_format = workbook.add_format({
                    "bg_color": week_colour,
                    "font_size":14,
                    "bold": True,
                    "text_wrap": True,
                    "valign": "top",
                })
                week_header_format = workbook.add_format({
                    "bg_color": week_header_colour,
                    "font_size": 16,
                    "bold": True,
                    "text_wrap": True,
                    "valign": "top",
                })
                outcome_header_format = workbook.add_format({
                    "bg_color": outcome_header_colour,
                    "font_size": 16,
                    "bold": True,
                    "text_wrap": True,
                    "valign": "top",
                })
                ponderation_format = workbook.add_format({
                    "font_size": 16,
                    "bold": True,
                    "text_wrap": True,
                    "valign": "top",
                })
                description_text_format = workbook.add_format({
                    "valign": "top",
                    "text_wrap": True,
                })

                for workflow in workflows:
                    (df, columns) = get_workflow_full_table(workflow, allowed_sets)
                    sheet_name = (
                        get_alphanum(workflow.title) + "_" + str(workflow.pk)
                    )[:30]
                    #Remove some columns when writing to excel
                    df.drop(columns=["rowtype","colour"]).to_excel(
                        writer,
                        sheet_name=sheet_name,
                        index=False,
                        header=False,
                    )
                    ws = writer.sheets[sheet_name]
                    #Set column widths
                    ws.set_column(0, 20, 40, wrap_format)
                    #Sticky header
                    ws.freeze_panes(4,0)
                    header = list(df.columns)
                    #Get our data columns that have to be coloured in
                    #The key is the original columns_order (the dataframe column), value is the column in excel
                    data_cols = {}
                    for i, name in enumerate(header):
                        if str(name).isdigit():
                            data_cols[name] = i

                    format_cache = {}
                    for row_idx, row in columns.iterrows():
                        colour = row["colour"]
                        column_order = row["column_order"]
                        if column_order in data_cols.keys():
                            format_cache[data_cols[column_order]] = workbook.add_format({
                                "bg_color": colour,
                                "border": 1,
                                "font_size": 16,
                                "bold": True,
                                "font_color": readable_text_color(colour),
                                "text_wrap": True,
                                "valign": "top",
                            })

                    for row_idx, row in df.iterrows():
                        rowtype = row["rowtype"]
                        if pd.isna(rowtype) or rowtype == "":
                            continue
                        if rowtype == "wf_title":
                            ws.set_row(row_idx,None,title_format)
                        elif rowtype == "week":
                            ws.set_row(row_idx,None,week_format)
                        elif rowtype == "columns":
                            ws.set_row(row_idx,None,week_header_format)
                            outcome_col = df.columns.get_loc("outcomes")
                            ws.write(row_idx,outcome_col,row["outcomes"],outcome_header_format)
                            for col_idx in data_cols.values():
                                value = row.iloc[col_idx]
                                ws.write(row_idx,col_idx,value,format_cache[col_idx])
                        elif rowtype == "wf_ponderation":
                            ws.write(row_idx,0,row["week"],ponderation_format)
                        elif rowtype == "wf_description":
                            ws.set_row(row_idx,60)
                            ws.write(row_idx,0,row["week"],ponderation_format)
                            ws.merge_range(row_idx,1,row_idx,len(df.columns)-3,row["outcomes"],description_text_format)
                        elif rowtype == "a_title" or rowtype == "b_description":
                            colour = row["colour"]
                            if pd.isna(colour) or colour == "":
                                continue
                            key = str(colour)+str(rowtype)

                            if key not in format_cache:
                                if rowtype == "a_title":
                                    format_cache[key] = workbook.add_format({
                                        "bg_color": colour,
                                        "border": 1,
                                        "font_color": readable_text_color(colour),
                                        "text_wrap": True,
                                        "valign": "top",
                                    })
                                else:
                                    format_cache[key] = workbook.add_format({
                                        "border": 1,
                                        "font_color": "#000000",
                                        "text_wrap": True,
                                        "valign": "top",
                                    })

                            cell_format = format_cache[key]
                            for col_idx in data_cols.values():
                                value = row.iloc[col_idx]
                                if pd.notna(value) and value != "":
                                    ws.write(row_idx, col_idx, value, cell_format)
        elif export_format == "csv":
            df = pd.DataFrame(
                {},
                columns=["week", "outcomes"],
            )
            for i, workflow in enumerate(workflows):
                df = pd.concat(
                    [df, get_workflow_full_table(workflow, allowed_sets)[0]]
                )
            df.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()
