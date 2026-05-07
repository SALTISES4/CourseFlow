"""Shared helpers for graph mutation HTTP responses (Ninja)."""

from ninja.errors import HttpError

from course_flow.api.schemas.graph_mutation import GraphMutationEnvelopeOut


def graph_mutation_http(
    payload: dict | None,
    err: str | None,
) -> GraphMutationEnvelopeOut:
    if err == "forbidden":
        raise HttpError(403, "Forbidden")
    if err == "bad_request":
        raise HttpError(400, "Bad request")
    if err == "not_found" or payload is None:
        raise HttpError(404, "Not found")
    return GraphMutationEnvelopeOut.model_validate(payload)
