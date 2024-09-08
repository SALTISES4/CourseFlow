from pydantic import BaseModel, conint


class DeleteRequest(BaseModel):
    objectId: conint(strict=True, gt=0)  # Ensure it's a positive integer
    objectType: str  # Basic type check, could be more specific depending on your needs
