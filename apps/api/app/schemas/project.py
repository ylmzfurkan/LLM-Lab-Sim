from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class WizardConfig(BaseModel):
    model_purpose: str
    target_domain: str
    model_language: str
    model_type: str


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    status: str
    current_step: int
    model_purpose: str | None
    target_domain: str | None
    model_language: str | None
    model_type: str | None

    model_config = {"from_attributes": True}
