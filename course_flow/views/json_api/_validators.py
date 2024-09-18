from pydantic import BaseModel


class DeleteRequest(BaseModel):
    objectType: str  # Basic type check, could be more specific depending on your needs
