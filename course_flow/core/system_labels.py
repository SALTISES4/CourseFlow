"""Stable identities for system-owned graph labels rendered by the React client."""

DEFAULT_CHANNELS_BY_WORKFLOW_TYPE: dict[str, tuple[tuple[str, str], ...]] = {
    "activity": (
        ("activity_out_of_class_instructor", "#0B118A"),
        ("activity_out_of_class_students", "#114BD4"),
        ("activity_in_class_instructor", "#268AE5"),
        ("activity_in_class_students", "#8BC8FF"),
    ),
    "course": (
        ("course_preparation", "#F7B92A"),
        ("course_lesson", "#ED8934"),
        ("course_artifact", "#ED4A28"),
        ("course_assessment", "#AD1D35"),
    ),
    "program": (
        ("custom_node_category", "#468884"),
        ("custom_node_category", "#6FA29F"),
        ("custom_node_category", "#98BDBB"),
    ),
}

SYSTEM_CHANNEL_LABEL_CODES = frozenset(
    code
    for channels in DEFAULT_CHANNELS_BY_WORKFLOW_TYPE.values()
    for code, _colour in channels
) | {"custom_node_category"}
