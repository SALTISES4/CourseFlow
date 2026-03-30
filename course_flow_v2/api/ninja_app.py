from ninja import NinjaAPI, Schema

from course_flow_v2.api.routers import auth, projects, threads, workflows

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
)

api.add_router("/project", projects.router)
api.add_router("/workflow", workflows.router)
api.add_router("/thread", threads.router)
api.add_router("/auth", auth.router)


class HealthResponse(Schema):
    status: str


@api.get("/health", response=HealthResponse, summary="Liveness check", tags=["meta"])
def health(request):
    return HealthResponse(status="ok")
