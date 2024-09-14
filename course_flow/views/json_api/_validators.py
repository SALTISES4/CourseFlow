from pydantic import BaseModel, conint


class DeleteRequest(BaseModel):
    objectType: str  # Basic type check, could be more specific depending on your needs
