from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserProfile

router = APIRouter()


@router.get("/me")
async def get_me(user: UserProfile = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "preferred_locale": user.preferred_locale,
    }


@router.put("/me")
async def update_me(
    data: dict,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if "display_name" in data:
        user.display_name = data["display_name"]
    if "preferred_locale" in data:
        user.preferred_locale = data["preferred_locale"]
    await db.commit()
    await db.refresh(user)
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "preferred_locale": user.preferred_locale,
    }
