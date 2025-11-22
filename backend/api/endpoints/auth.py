"""
Authentication endpoints

Supports invitation-based registration flow:
1. Admin creates user invitation (email + role, NO password)
2. User checks email with /auth/check-email
3. If invited but not registered, user completes registration with /auth/register
4. If registered, user logs in with /auth/login
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from passlib.context import CryptContext

from backend.database import get_db, UserDB
from backend.api.dependencies import (
    get_current_user,
    verify_password,
    create_access_token
)
from backend.models import (
    LoginRequest,
    LoginResponse,
    CheckEmailRequest,
    CheckEmailResponse,
    RegisterRequest,
    RegisterResponse
)

router = APIRouter()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/auth/check-email", response_model=CheckEmailResponse)
async def check_email(
    request: CheckEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Check if email exists in whitelist and registration status

    This endpoint is used in the multi-step login flow to determine
    which step to show the user next:
    - Email not found → Access Denied
    - Email found + not registered → Registration Form
    - Email found + registered → Password Login

    Args:
        request: Email to check
        db: Database session

    Returns:
        CheckEmailResponse with email status
    """
    print(f"📧 POST /auth/check-email - Email: {request.email}")

    user = db.query(UserDB).filter(UserDB.email == request.email).first()

    if not user:
        print(f"   ❌ Email not in whitelist: {request.email}")
        return CheckEmailResponse(
            exists=False,
            is_registered=False,
            full_name=None
        )

    print(f"   ✅ Email found - Registered: {user.is_registered}")

    return CheckEmailResponse(
        exists=True,
        is_registered=user.is_registered,
        full_name=user.full_name if user.is_registered else None
    )


@router.post("/auth/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Complete user registration (invited user sets password)

    Args:
        request: Email, password, and full name
        db: Database session

    Returns:
        RegisterResponse with access token and user info

    Raises:
        HTTPException: If email not in whitelist or already registered
    """
    print(f"📝 POST /auth/register - Email: {request.email}")

    # 1. Validate email exists in whitelist
    user = db.query(UserDB).filter(UserDB.email == request.email).first()

    if not user:
        print(f"   ❌ Email not in whitelist: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este email no tiene una invitación válida. Contacta al administrador."
        )

    # 2. Validate user is NOT already registered
    if user.is_registered:
        print(f"   ❌ User already registered: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuario ya completó su registro. Usa el login normal."
        )

    # 3. Validate password strength (min 8 chars enforced by Pydantic)
    # Additional validation could be added here

    # 4. Hash password and complete registration
    user.password_hash = pwd_context.hash(request.password)
    user.full_name = request.full_name  # Allow updating name during registration
    user.is_registered = True
    user.registered_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    # 5. Create access token (auto-login after registration)
    access_token = create_access_token(user.id, user.role)

    # 6. Update last_login
    user.last_login = datetime.utcnow()
    db.commit()

    print(f"   ✅ Registration completed: {user.id} ({user.role})")

    return RegisterResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
        }
    )


@router.post("/auth/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    User login endpoint (for registered users only)

    Args:
        credentials: Email and password
        db: Database session

    Returns:
        LoginResponse with access token and user info

    Raises:
        HTTPException: If credentials are invalid, user not registered, or user inactive
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

    # NEW: Check if user completed registration
    if not user.is_registered:
        print(f"   ❌ User not registered yet: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes completar tu registro antes de iniciar sesión"
        )

    # Verify password
    if not user.password_hash or not verify_password(credentials.password, user.password_hash):
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
