"""
@todo separate out domain specific tasks from generalized utils

"""
import re
import time

import pandas as pd
from django.db.models import Q
from django.http import HttpResponse, JsonResponse


class Utility:
    @staticmethod
    def get_alphanum(string):
        return re.sub(r"\W+", "", string)

    @staticmethod
    def multiple_replace(dict, text):
        """
        Create a regex from dict keys
        :param text:
        :return:
        """
        regex = re.compile("(%s)" % "|".join(map(re.escape, dict.keys())))
        return regex.sub(
            lambda mo: dict[mo.string[mo.start() : mo.end()]], text
        )

    @staticmethod
    def dateTimeFormat():
        return "%Y/%m/%d"

    @staticmethod
    def dateTimeFormatNoSpace():
        return "%Y_%m_%d_%H_%m_%s"

    @staticmethod
    def linkIDMap(link):
        return link.id

    @staticmethod
    def save_serializer(serializer) -> HttpResponse:
        if serializer:
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({"action": "posted"})
            else:
                return JsonResponse({"action": "error"})
        else:
            return JsonResponse({"action": "error"})

    @staticmethod
    def get_relevance(obj, name_filter, keywords):
        if obj.title is None:
            title = ""
        else:
            title = obj.title.lower()
        if obj.description is None:
            description = ""
        else:
            description = obj.description.lower()
        if obj.author is None:
            first = ""
            last = ""
            username = ""
        else:
            if obj.author.first_name is None:
                first = ""
            else:
                first = obj.author.first_name
            if obj.author.last_name is None:
                last = ""
            else:
                last = obj.author.last_name
            if obj.author.username is None:
                username = ""
            else:
                username = obj.author.username
        relevance = ""
        to_check = [name_filter] + keywords
        keys = [title, last, first, username, description]
        for key in keys:
            for keyword in to_check:
                if keyword == "":
                    continue
                if key.startswith(keyword):
                    relevance += "0"
                elif key.find(" " + keyword) >= 0:
                    relevance += "1"
                else:
                    relevance += "2"
        return relevance

    @staticmethod
    def benchmark(identifier, last_time):
        current_time = time.time()
        print(
            "Completed " + identifier + " in " + str(current_time - last_time)
        )
        return current_time

    @staticmethod
    def concat_line(df, dict):
        return pd.concat([df, pd.DataFrame([dict])])

    @staticmethod
    def concat_df(df1, df2):
        return pd.concat([df1, df2])

    @staticmethod
    def get_str(obj, key):
        s = obj.get(key, "")
        return "" if s is None else s

    @staticmethod
    def stringify(value):
        if value is None:
            return ""
        else:
            return str(value)

    @staticmethod
    def allowed_sets_Q(allowed_sets):
        return Q(sets__in=allowed_sets) | Q(sets=None)

    @staticmethod
    def check_allowed_sets(obj, allowed_sets):
        if obj.sets.all().count() == 0:
            return True
        if (
            obj.sets.filter(
                id__in=allowed_sets.values_list("id", flat=True)
            ).count()
            > 0
        ):
            return True
        return False
