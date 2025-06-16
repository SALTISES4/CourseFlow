from rest_framework import serializers


class PaginationSerializer(serializers.Serializer):
    page = serializers.IntegerField(min_value=0, default=0)


class SortSerializer(serializers.Serializer):
    value = serializers.ChoiceField(
        choices=[
            ("DATE_CREATED", "Date Created"),
            ("A_Z", "Alphabetical"),
            ("DATE_MODIFIED", "Date Modified"),
        ],
        required=True,
    )
    direction = serializers.ChoiceField(
        choices=[
            ("ASC", "Ascending"),
            ("DESC", "Descending"),
        ],
        required=True,
    )


class FilterSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    # Accepts string, number, array, or boolean
    value = serializers.JSONField(required=True)


class SearchSerializer(serializers.Serializer):
    pagination = PaginationSerializer(required=False, default={"page": 0})
    sort = SortSerializer(
        required=False, allow_null=True, default={"value": "DATE_CREATED", "direction": "ASC"}
    )
    filters = FilterSerializer(many=True, required=False, default=[])
    results_per_page = serializers.IntegerField(default=10)

    @staticmethod
    def validate_filters(filters):
        # Filters Whitelist
        allowed_filters = {
            "type",
            "discipline",
            "isTemplate",
            "isPublished",
            "keyword",
            "workspaceType",
            "parentProject",
            "project",
        }
        for filter_item in filters:
            if filter_item["name"] not in allowed_filters:
                raise serializers.ValidationError(f"Filter {filter_item['name']} is not allowed.")
        return filters
