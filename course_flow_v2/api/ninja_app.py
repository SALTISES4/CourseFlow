from ninja import NinjaAPI, Schema

from course_flow_v2.api.routers import projects, workflows

api = NinjaAPI(
    title="CourseFlow V2 API",
    version="0.1.0",
    description="OpenAPI is generated from Ninja routes and schemas.",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

api.add_router("/projects", projects.router)
api.add_router("/workflows", workflows.router)


class HealthResponse(Schema):
    status: str


@api.get("/health", response=HealthResponse, summary="Liveness check", tags=["meta"])
def health(request):
    return HealthResponse(status="ok")
