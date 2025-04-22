#Handles all the logic for the moodle json export
from .models import (
	Workflow,
	Week,
	Node,
	Outcome,
)
from .serializers import (
	TitleSerializerMixin, 
	DescriptionSerializerMixin,
	OutcomeExportSerializer,
)
from .utils import get_all_outcomes_ordered

from django.db.models import Q
from django.utils.translation import gettext as _
from rest_framework import serializers
import pandas as pd


# Used for moodle json export. Puts the node into a format that can be directly read by the plugin
class MoodleNodeSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
	class Meta:
	    model = Node
	    fields = [
	        "id",
	        "lessonname",
	        "lessonintro",
	        "outcomes",
	        "pagetitle",
	        "pagecontents",
	        "lessontype_display",
	        "lessontype",
	        "colour",
	    ]

	lessonname = serializers.SerializerMethodField()
	lessonintro = serializers.SerializerMethodField()
	lessontype = serializers.SerializerMethodField()
	lessontype_display = serializers.SerializerMethodField()
	pagetitle = serializers.SerializerMethodField()
	pagecontents = serializers.SerializerMethodField()
	outcomes = serializers.SerializerMethodField()
	colour = serializers.SerializerMethodField()


	def get_outcomes_list(self, instance):
		links = instance.outcomenode_set.exclude(
			Q(outcome__deleted=True)
			| Q(outcome__parent_outcomes__deleted=True)
			| Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
		)
		return [link.outcome.id for link in links]

	def get_outcomes(self, instance):
		return self.get_outcomes_list(instance)

	def get_lessonname(self, instance):
		return self.get_title(instance)

	def get_lessonintro(self, instance):
		return self.get_description(instance)

	def get_lessontype_display(self, instance):
		return instance.column.get_display_title()

	def get_lessontype(self, instance):
		return instance.column.column_type

	def get_pagetitle(self, instance):
		return _("Outcomes")

	def get_pagecontents(self, instance):
		outcomes = self.get_outcomes_list(instance)
		outcomes_df = self.context.get("outcomes")
		if outcomes_df is not None:
			filtered_df = outcomes_df[outcomes_df["id"].isin(outcomes)]
		return "\n\n".join(list(filtered_df["contents"]))

	def get_colour(self, instance):
		return instance.column.colour



class MoodleWeekSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
):

    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "lessons",
        ]

    def get_lessons(self, instance):
        lessons = Node.objects.filter(week=instance,deleted=False)
        return MoodleNodeSerializer(lessons,many=True,context=self.context).data

def get_moodle_json(workflow_id):
	workflow = Workflow.objects.get(id=workflow_id)
	outcomes = get_all_outcomes_ordered(workflow)
	outcomes_serialized = OutcomeExportSerializer(outcomes,many=True).data
	outcomes_df = pd.DataFrame(outcomes_serialized)
	if outcomes_df.shape[0] > 0:
		outcomes_df["shortname"] = outcomes_df["code"]
		outcomes_df["fullname"] = outcomes_df["title"]
		outcomes_df["contents"] = outcomes_df["code"] + " - " + outcomes_df["fullname"]
	weeks = Week.objects.filter(workflow__id = workflow_id,deleted=False)
	weeks_serialized = MoodleWeekSerializer(weeks,many=True,context={"outcomes":outcomes_df}).data
	return {
		"sections":weeks_serialized,
		"outcomes":outcomes_df.to_dict("records")
	}
