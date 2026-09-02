from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping


@dataclass(frozen=True, slots=True)
class ErrorDescriptor:
    code: str
    params: Mapping[str, Any] = field(default_factory=dict)

    def as_payload(self) -> dict[str, Any]:
        return {"code": self.code, "params": dict(self.params)}


class ExpectedApiError(Exception):
    """An expected failure whose machine code is safe for clients to branch on."""

    def __init__(
        self,
        status_code: int,
        code: str,
        *,
        params: Mapping[str, Any] | None = None,
        field_errors: Mapping[str, ErrorDescriptor] | None = None,
    ) -> None:
        super().__init__(code)
        self.status_code = status_code
        self.code = code
        self.params = dict(params or {})
        self.field_errors = dict(field_errors or {})

    def as_payload(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "code": self.code,
            "params": self.params,
        }
        if self.field_errors:
            payload["fieldErrors"] = {
                name: issue.as_payload()
                for name, issue in self.field_errors.items()
            }
        return payload


def validation_error(
    errors: Mapping[str, str],
) -> ExpectedApiError:
    return ExpectedApiError(
        400,
        "validation_failed",
        field_errors={
            field_name: ErrorDescriptor(code=code)
            for field_name, code in errors.items()
        },
    )
