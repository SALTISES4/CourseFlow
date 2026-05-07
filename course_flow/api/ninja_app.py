from ninja import NinjaAPI, Router

from course_flow.api.common.schemas import CamelSchema
from course_flow.api.routers import (
    auth,
    channels,
    edges,
    graphs,
    library,
    nodes,
    notifications,
    projects,
    sections,
    threads,
    users,
)

api = NinjaAPI(
    title="CourseFlow V2 API",
    version="0.1.0",
    description=(
        "OpenAPI is generated from Ninja routes and schemas. "
        "Primary CRUD routes return entity fields only. "
        "Graph graph/editor loads use 'GET /graph/{uuid}/view' (flat projection). "
        "See 'course_flow.api.conventions' and 'course_flow.api.schemas.graph_view'."
    ),
    docs_url="/docs",
    openapi_url="/openapi.json",
    default_router=Router(by_alias=True),
)

api.add_router("/project", projects.router)
api.add_router("/graph", graphs.router)
api.add_router("/graph", channels.graph_collection_router)
api.add_router("/graph", sections.graph_collection_router)
api.add_router("/graph", nodes.graph_collection_router)
api.add_router("/graph", edges.graph_edges_router)
api.add_router("/channel", channels.resource_router)
api.add_router("/section", sections.resource_router)
api.add_router("/node", nodes.node_resource_router)
api.add_router("/edge", edges.edge_resource_router)
api.add_router("/thread", threads.router)
api.add_router("/auth", auth.router)
api.add_router("/user", users.router)
api.add_router("/user", notifications.router)
api.add_router("/library", library.router)


class HealthResponse(CamelSchema):
    status: str


@api.get("/health", response=HealthResponse, summary="Liveness check", tags=["meta"])
def health(request):
    return HealthResponse(status="ok")
