"""
Authentication endpoints

Supports invitation-based registration flow:
1. Admin creates user invitation (email + role, NO password)
2. User checks email with /auth/check-email
3. If invited but not registered, user completes registration with /auth/register
4. If registered, user logs in with /auth/login

Refactored to use AuthService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to AuthService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db, UserDB
from backend.api.dependencies import get_current_user
from backend.models import (
    LoginRequest,
    LoginResponse,
    CheckEmailRequest,
    CheckEmailResponse,
    RegisterRequest,
    RegisterResponse
)
from backend.services.auth_service import AuthService

router = APIRouter()


def get_auth_service_dependency(db: Session = Depends(get_db)) -> AuthService:
    """Dependency injection for AuthService"""
    return AuthService(db)


@router.post("/auth/check-email", response_model=CheckEmailResponse)
async def check_email(
    request: CheckEmailRequest,
    service: AuthService = Depends(get_auth_service_dependency)
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
        service: Injected AuthService instance

    Returns:
        CheckEmailResponse with email status
    """
    print(f"📧 POST /auth/check-email - Email: {request.email}")

    result = service.check_email(request.email)

    if not result["exists"]:
        print(f"   ❌ Email not in whitelist: {request.email}")
    else:
        print(f"   ✅ Email found - Registered: {result['is_registered']}")

    return CheckEmailResponse(**result)


@router.post("/auth/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    service: AuthService = Depends(get_auth_service_dependency)
):
    """
    Complete user registration (invited user sets password)

    Args:
        request: Email, password, and full name
        service: Injected AuthService instance

    Returns:
        RegisterResponse with access token and user info

    Raises:
        HTTPException: If email not in whitelist or already registered
    """
    print(f"📝 POST /auth/register - Email: {request.email}")

    try:
        result = service.register_user(
            email=request.email,
            password=request.password,
            full_name=request.full_name
        )

        print(f"   ✅ Registration completed: {result['user']['id']} ({result['user']['role']})")

        return RegisterResponse(**result)

    except ValueError as e:
        print(f"   ❌ Registration failed: {str(e)}")
        status_code = status.HTTP_403_FORBIDDEN if "invitación" in str(e) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail=str(e)
        )


@router.post("/auth/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    service: AuthService = Depends(get_auth_service_dependency)
):
    """
    User login endpoint (for registered users only)

    Args:
        credentials: Email and password
        service: Injected AuthService instance

    Returns:
        LoginResponse with access token and user info

    Raises:
        HTTPException: If credentials are invalid, user not registered, or user inactive
    """
    print(f"🔐 POST /auth/login - Email: {credentials.email}")

    try:
        result = service.login_user(
            email=credentials.email,
            password=credentials.password
        )

        print(f"   ✅ Login successful: {result['user']['id']} ({result['user']['role']})")

        return LoginResponse(**result)

    except ValueError as e:
        print(f"   ❌ Login failed: {str(e)}")

        # Determine appropriate status code based on error message
        if "completar tu registro" in str(e):
            status_code = status.HTTP_403_FORBIDDEN
        elif "inactivo" in str(e):
            status_code = status.HTTP_403_FORBIDDEN
        else:
            status_code = status.HTTP_401_UNAUTHORIZED

        raise HTTPException(
            status_code=status_code,
            detail=str(e)
        )


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
