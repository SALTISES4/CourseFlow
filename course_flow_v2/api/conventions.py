"""API layering conventions for CourseFlow V2 (Ninja).

Entity resources
    Primary CRUD routes (e.g. ``/project``, ``/workflow``) return *entity* payloads
    only: fields that belong to the persisted resource, without embedding related
    graphs or editor-specific joins.

Graph / editor projections
    Loading everything needed to render the workflow graph in one round trip uses
    dedicated *projection* routes (e.g. ``GET .../workflow/{uuid}/graph``).
    Projections return **flat** top-level collections (lists) keyed by type, linked by
    **UUID references** between rows—not nested trees.

Comments / threads
    Projections may expose ``thread_uuid`` and/or ``comment_count`` per thread for UI
    badges. Full comment bodies stay behind separate thread/comment endpoints.

This module documents the contract; enforcement is by schema placement and route
naming under ``course_flow_v2.api``.
"""
