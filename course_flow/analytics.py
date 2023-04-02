import calendar

import pandas as pd

from .models import Project, Workflow
from .serializers import AnalyticsSerializer


def month_replace(x):
    return calendar.month_abbr[int(x.string)]


def fix_months(df):
    for i, level in enumerate(df.index.levels):
        if level.name == "Month":
            df.index = df.index.set_levels(
                level.str.replace(r"^\d{1,2}$", month_replace), level=i
            )


def get_base_dataframe():
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

    return df


def get_workflow_table(df=get_base_dataframe()):

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
    fix_months(pt)

    return pt


def get_user_table(df=get_base_dataframe()):
    df3 = df.groupby(["Year", "Month", "type"])

    user_counts = df3["User"].nunique()

    user_counts = user_counts.unstack()

    fix_months(user_counts)

    return user_counts


def get_user_details_table(df=get_base_dataframe()):
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
    df5

    df_totals = pd.concat([df_sum, df2, df3, df4])

    df_totals = df_totals.loc[~(df_totals.any(1) == 0)]

    def sort_key(index):
        if index.name == "Institution":
            return index.str.replace("Month Total", "zzz")
        return index

    df_totals = df_totals.sort_index(key=sort_key)

    df_totals.loc["Grand Total", :] = df5.values

    fix_months(df_totals)

    return df_totals
