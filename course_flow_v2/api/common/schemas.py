"""Transport-layer schemas: snake_case Python fields, camelCase JSON aliases."""

from __future__ import annotations

from ninja import Schema
from pydantic import ConfigDict


def to_camel(name: str) -> str:
    """Convert ``snake_case`` identifiers to ``camelCase`` for JSON aliases."""
    head, *tail = name.split("_")
    return head + "".join(part[:1].upper() + part[1:] for part in tail if part)


class CamelSchema(Schema):
    """Base for Ninja ``Schema`` models exposed on the public HTTP API.

    Python attributes stay snake_case; serialized JSON uses camelCase via Pydantic
    ``alias_generator``. Incoming bodies may use either form when
    ``populate_by_name`` is enabled.
    """

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class SuccessOut(CamelSchema):
    """Minimal typed body for simple destructive operations (e.g. delete)."""

    success: bool = True
