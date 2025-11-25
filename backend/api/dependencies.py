"""
FastAPI dependencies for dependency injection
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from datetime import datetime, timedelta
from typing import Optional

from backend.integrations import GeminiClient
from backend.config import settings
from backend.database import get_db, UserDB
from backend.models import Role
from backend.utils import hash_password, verify_password  # Re-exported for backwards compatibility


# ============================================================================
# Gemini Client Dependency
# ============================================================================

def get_gemini_client() -> GeminiClient:
    """Get Gemini client instance"""
    return GeminiClient(api_key=settings.gemini_api_key)


# ============================================================================
# Authentication Dependencies
# ============================================================================

security = HTTPBearer()

# Note: hash_password() and verify_password() are imported from backend.utils.security
# and re-exported here for backwards compatibility with existing code


def create_access_token(user_id: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token

    Args:
        user_id: User ID
        role: User role
        expires_delta: Token expiration time (default: 24 hours)

    Returns:
        JWT token string
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=24)

    expire = datetime.utcnow() + expires_delta

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow()
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    """
    Decode and validate JWT token

    Args:
        token: JWT token string

    Returns:
        Decoded payload

    Raises:
        ValueError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expirado")
    except jwt.InvalidTokenError:
        raise ValueError("Token inválido")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserDB:
    """
    Get current authenticated user from JWT token

    Args:
        credentials: HTTP Bearer token
        db: Database session

    Returns:
        User database object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: user_id no encontrado"
            )

        user = db.query(UserDB).filter(UserDB.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )

        return user

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


def require_role(*allowed_roles: Role):
    """
    Dependency factory to require specific roles

    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user: UserDB = Depends(require_role(Role.ADMIN))):
            ...

    Args:
        allowed_roles: Roles that are allowed to access the endpoint

    Returns:
        Dependency function that checks user role
    """
    def role_checker(user: UserDB = Depends(get_current_user)) -> UserDB:
        if Role(user.role) not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requiere rol: {', '.join(r.value for r in allowed_roles)}"
            )
        return user

    return role_checker
