import calendar
import time

import pandas as pd
from django.core.cache import cache

from course_flow.models import Project, Workflow
from course_flow.serializers import AnalyticsSerializer
from course_flow.utils import benchmark


def month_replace(x):
    return calendar.month_abbr[int(x.string)]


def fix_months(df):
    for i, level in enumerate(df.index.levels):
        if level.name == "Month":
            df.index = df.index.set_levels(
                level.str.replace(r"^\d{1,2}$", month_replace, regex=True),
                level=i,
            )


def get_base_dataframe():

    df = cache.get("COURSEFLOW_ANALYTICS_DATAFRAME", None)
    if df is not None:
        return df

    projects = AnalyticsSerializer(
        Project.objects.exclude(author=None), many=True
    ).data
    workflows = AnalyticsSerializer(
        Workflow.objects.exclude(author=None), many=True
    ).data

    df = pd.DataFrame(projects + workflows)
    created_data = df["created_on"].str.split(" ", expand=True)
    df["Year"] = created_data[0]
    df["Month"] = created_data[1]

    df = df.loc[df["nodes"] >= 3]

    # df["content_rich"] = df["nodes"]>=3
    # df["content_rich"]=pd.Categorical(df["content_rich"])
    # for cat in [True,False]:
    #   if cat not in df["content_rich"].cat.categories:
    #     df["content_rich"] = df["content_rich"].cat.add_categories(cat)
    df["type"] = pd.Categorical(df["type"])
    for cat in ["activity", "course", "program", "project"]:
        if cat not in df["type"].cat.categories:
            df["type"] = df["type"].cat.add_categories(cat)

    df["Institution"] = df["email"].str.rsplit("@", expand=True, n=1)[1]

    # df["Month"] = df["Month"].apply(lambda x: calendar.month_abbr[int(x)])

    cache.set("COURSEFLOW_ANALYTICS_DATAFRAME", df, 600)

    return df


def get_workflow_table(df=None):
    if df is None:
        df = get_base_dataframe()

    pt = pd.pivot_table(
        df,
        values="nodes",
        columns="type",
        index=["Year", "Month"],
        aggfunc="count",
        fill_value=0,
        margins=True,
    )

    pt.fillna(0, inplace=True)
    pt["All"] = pt["All"].astype("int")
    fix_months(pt)
    return pt


def get_user_table(df=None):
    if df is None:
        df = get_base_dataframe()
    df1 = df.copy()
    df1["is_active"] = df1["User"].str.contains("(active)")
    df2 = df1.groupby(["Year", "Month"])
    df3 = df1.groupby(["Year", "Month", "type"])

    user_counts = df2["User"].nunique()
    active_counts = (
        df1.loc[df1["is_active"]].groupby(["Year", "Month"])["User"].nunique()
    )

    type_counts = df3["User"].nunique()
    type_counts = type_counts.unstack()
    type_counts["Total Unique Users"] = user_counts
    type_counts["Total Active Users"] = active_counts

    year_counts = df1.groupby(["Year", "type"])["User"].nunique()
    year_counts_user = df1.groupby(["Year"])["User"].nunique()
    year_counts_active = (
        df1.loc[df1["is_active"]].groupby(["Year"])["User"].nunique()
    )
    year_counts = (
        year_counts.reindex(
            pd.MultiIndex.from_product(
                [level for level in year_counts.index.levels]
                + [["Year Total"]]
            )
        )
        .unstack(1)
        .unstack()
    )
    year_counts["Total Unique Users", "Year Total"] = year_counts_user
    year_counts["Total Active Users", "Year Total"] = year_counts_active

    type_counts = pd.concat([type_counts, year_counts.stack()]).sort_index()
    type_counts.fillna(0, inplace=True)
    type_counts["Total Unique Users"] = type_counts[
        "Total Unique Users"
    ].astype("int")
    type_counts["Total Active Users"] = type_counts[
        "Total Active Users"
    ].astype("int")

    fix_months(type_counts)

    return type_counts


def get_user_details_table(df=None):
    if df is None:
        df = get_base_dataframe()
    df = get_base_dataframe()

    df_sum = (
        df.groupby(["Year", "Month", "Institution", "User", "type"])
        .size()
        .unstack()
    )
    df2 = df.groupby(["Year", "Month", "Institution", "type"]).size().unstack()
    df2 = df2.reindex(
        pd.MultiIndex.from_product(
            [level for level in df2.index.levels] + [["Domain Total"]]
        )
    )
    df3 = df.groupby(["Year", "Month", "type"]).size().unstack()
    df3 = df3.reindex(
        pd.MultiIndex.from_product(
            [level for level in df3.index.levels] + [["Month Total"], [""]]
        )
    )
    df4 = df.groupby(["Year", "type"]).size()
    df4 = df4.reindex(
        pd.MultiIndex.from_product(
            [level for level in df4.index.levels]
            + [["Year Total"], [""], [""]]
        )
    ).unstack(1)
    df5 = df4.sum()

    df_totals = pd.concat([df_sum, df2, df3, df4])

    df_totals = df_totals.loc[~(df_totals.any(axis=1) == 0)]

    def sort_key(index):
        if index.name == "Institution":
            return index.str.replace("Month Total", "zzz")
        return index

    df_totals = df_totals.sort_index(key=sort_key)

    df_totals.loc["Grand Total", :] = df5.values

    df_totals["activity"] = df_totals["activity"].astype("int")
    df_totals["course"] = df_totals["course"].astype("int")
    df_totals["program"] = df_totals["program"].astype("int")
    df_totals["project"] = df_totals["project"].astype("int")

    fix_months(df_totals)

    return df_totals
