from ninja import NinjaAPI, Router

from course_flow_v2.api.common.schemas import CamelSchema
from course_flow_v2.api.routers import (
    auth,
    channels,
    edges,
    library,
    nodes,
    notifications,
    projects,
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
        "Workflow graph/editor loads use ``GET /workflow/{uuid}/graph`` (flat projection). "
        "See ``course_flow_v2.api.conventions`` and ``course_flow_v2.api.schemas.workflow_graph``."
    ),
    docs_url="/docs",
    openapi_url="/openapi.json",
    default_router=Router(by_alias=True),
)

api.add_router("/project", projects.router)
api.add_router("/workflow", workflows.router)
api.add_router("/workflow", channels.workflow_collection_router)
api.add_router("/workflow", sections.workflow_collection_router)
api.add_router("/workflow", nodes.workflow_collection_router)
api.add_router("/workflow", edges.workflow_edges_router)
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
