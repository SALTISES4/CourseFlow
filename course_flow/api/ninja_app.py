from django.db import connection
from ninja import NinjaAPI, Router

from course_flow.api.common.schemas import CamelSchema
from course_flow.api.errors import ExpectedApiError
from course_flow.api.routers import (
    auth,
    channels,
    edges,
    graphs,
    library,
    nodes,
    notifications,
    outcomes,
    projects,
    public_workflows,
    reference_data,
    sections,
    threads,
    users,
    workflows,
)

api = NinjaAPI(
    title="CourseFlow V2 API",
    version="0.1.0",
    description=(
        "OpenAPI is generated from Ninja routes and schemas. "
        "Primary CRUD routes return entity fields only. "
        "Graph editor loads use 'GET /graph/{uuid}/view' (Graph View payload). "
        "See 'course_flow.api.conventions' and 'course_flow.api.schemas.graph_view'."
    ),
    docs_url="/docs",
    openapi_url="/openapi.json",
    default_router=Router(by_alias=True),
)


@api.exception_handler(ExpectedApiError)
def expected_api_error_handler(request, exc: ExpectedApiError):
    return api.create_response(
        request,
        exc.as_payload(),
        status=exc.status_code,
    )

api.add_router("/project", projects.router)
api.add_router("/workflow", workflows.router)
api.add_router("/public", public_workflows.router)
api.add_router("/graph", graphs.router)
api.add_router("/graph", channels.graph_collection_router)
api.add_router("/graph", sections.graph_collection_router)
api.add_router("/graph", nodes.graph_collection_router)
api.add_router("/graph", outcomes.graph_collection_router)
api.add_router("/graph", edges.graph_edges_router)
api.add_router("/channel", channels.resource_router)
api.add_router("/section", sections.resource_router)
api.add_router("/node", nodes.node_resource_router)
api.add_router("/outcome", outcomes.outcome_resource_router)
api.add_router("/edge", edges.edge_resource_router)
api.add_router("/thread", threads.router)
api.add_router("/auth", auth.router)
api.add_router("/user", users.router)
api.add_router("/user", notifications.router)
api.add_router("/library", library.router)
api.add_router("/reference-data", reference_data.router)


class HealthResponse(CamelSchema):
    status: str


@api.get("/health", response=HealthResponse, summary="Liveness check", tags=["meta"])
def health(request):
    return HealthResponse(status="ok")


@api.get("/ready", response=HealthResponse, summary="Readiness check", tags=["meta"])
def ready(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return HealthResponse(status="ok")
