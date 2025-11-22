"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db, UserDB
from backend.api.dependencies import (
    get_current_user,
    verify_password,
    create_access_token
)
from backend.models import LoginRequest, LoginResponse

router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    User login endpoint

    Args:
        credentials: Email and password
        db: Database session

    Returns:
        LoginResponse with access token and user info

    Raises:
        HTTPException: If credentials are invalid or user is inactive
    """
    print(f"🔐 POST /auth/login - Email: {credentials.email}")

    # Find user by email
    user = db.query(UserDB).filter(UserDB.email == credentials.email).first()

    if not user:
        print(f"   ❌ User not found: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        print(f"   ❌ Invalid password for user: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )

    # Check if user is active
    if not user.is_active:
        print(f"   ❌ User is inactive: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador."
        )

    # Create access token
    access_token = create_access_token(user.id, user.role)

    # Update last_login
    user.last_login = datetime.utcnow()
    db.commit()

    print(f"   ✅ Login successful: {user.id} ({user.role})")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
        }
    }


@router.get("/auth/me")
async def get_current_user_info(
    user: UserDB = Depends(get_current_user)
):
    """
    Get current authenticated user information

    Args:
        user: Current authenticated user (from JWT token)

    Returns:
        User information
    """
    print(f"📋 GET /auth/me - User: {user.id}")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


@router.post("/auth/logout")
async def logout(
    user: UserDB = Depends(get_current_user)
):
    """
    User logout endpoint

    Note: With JWT tokens, logout is handled client-side by removing the token.
    This endpoint is provided for consistency and potential future stateful session management.

    Args:
        user: Current authenticated user

    Returns:
        Success message
    """
    print(f"🚪 POST /auth/logout - User: {user.id}")

    return {"message": "Logout exitoso"}
