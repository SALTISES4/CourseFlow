"""API layering conventions for CourseFlow V2 (Ninja).

JSON transport naming
    Python code (services, ORM, Ninja handler parameters, DTOs) uses **snake_case**.
    Public HTTP JSON bodies (request and response) use **camelCase** field names.

    API request/response models inherit from ``CamelSchema`` in
    ``course_flow.api.common.schemas``, which applies a Pydantic v2
    ``alias_generator`` so ORM-friendly snake_case attributes map to camelCase in
    JSON. Avoid per-field ``Field(alias=...)`` unless the alias generator cannot
    express an exception. Prefer typed ``CamelSchema`` (or nested schemas) over
    returning raw ``dict`` from routes when the payload is part of the frontend
    contract.

    Query and path parameters are not globally rewritten: path kwargs stay
    snake_case in Python; list routes that take explicit query parameters (for
    example notification pagination) use **snake_case** query names
    (``page``, ``page_size``) unless a future change standardizes otherwise.

Entity resources
    Primary CRUD routes (e.g. ``/project``, ``/graph``) return *entity* payloads
    only: fields that belong to the persisted resource, without embedding related
    graphs or editor-specific joins.

Graph / editor projections
    Loading everything needed to render the graph in one round trip uses
    dedicated *projection* routes (e.g. ``GET .../graph/{uuid}/view``).
    Projections return **flat** top-level collections (lists) keyed by type, linked by
    **UUID references** between rows—not nested trees.

Comments / threads
    Projections may expose ``thread_uuid`` and/or ``comment_count`` per thread for UI
    badges. Full comment bodies stay behind separate thread/comment endpoints.

This module documents the contract; enforcement is by schema placement and route
naming under ``course_flow.api``.
"""
