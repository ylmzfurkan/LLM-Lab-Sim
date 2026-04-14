from fastapi import Depends, HTTPException, Header
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import UserProfile


DEMO_AUTH_ID = "demo-user"
DEMO_EMAIL = "demo@local"


async def _get_or_create_user(db: AsyncSession, auth_id: str, email: str) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.auth_id == auth_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = UserProfile(auth_id=auth_id, email=email)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    # Auth disabled: return a persistent demo profile (useful for local/demo deploys).
    if not settings.require_auth:
        return await _get_or_create_user(db, DEMO_AUTH_ID, DEMO_EMAIL)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            audience="authenticated",
        )
        auth_id: str = payload.get("sub")
        if auth_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return await _get_or_create_user(db, auth_id, payload.get("email", ""))
