"""
User management endpoints

Supports invitation-based user creation:
- POST /users/invite - Create user invitation (email + role, NO password)
- GET /users - List all users with registration status
- PUT /users/{user_id} - Update user (admin only)
- DELETE /users/{user_id} - Delete user (admin only)

Refactored to use UserService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to UserService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db, UserDB
from backend.api.dependencies import (
    get_current_user,
    require_role
)
from backend.models import User, CreateUserDTO, UpdateUserDTO, CreateUserInvitationDTO, Role
from backend.services.user_service import UserService

router = APIRouter()


def get_user_service_dependency(db: Session = Depends(get_db)) -> UserService:
    """Dependency injection for UserService"""
    return UserService(db)


@router.get("/users", response_model=List[User])
async def get_users(
    service: UserService = Depends(get_user_service_dependency),
    current_user: UserDB = Depends(require_role(Role.ADMIN, Role.MANAGER))
):
    """
    Get all users

    Only ADMIN and MANAGER roles can view users.

    Args:
        service: Injected UserService instance
        current_user: Current authenticated user (ADMIN or MANAGER)

    Returns:
        List of all users
    """
    print(f"📋 GET /users - Requested by: {current_user.id} ({current_user.role})")

    users = service.get_all_users()

    print(f"   Found {len(users)} users")

    return users


@router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: str,
    service: UserService = Depends(get_user_service_dependency),
    current_user: UserDB = Depends(require_role(Role.ADMIN, Role.MANAGER))
):
    """
    Get a specific user by ID

    Only ADMIN and MANAGER roles can view user details.

    Args:
        user_id: User ID
        service: Injected UserService instance
        current_user: Current authenticated user

    Returns:
        User object

    Raises:
        HTTPException: If user not found
    """
    print(f"📋 GET /users/{user_id} - Requested by: {current_user.id}")

    user = service.get_user_by_id(user_id)

    if not user:
        print(f"   ❌ User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario {user_id} no encontrado"
        )

    print(f"   ✅ User found: {user.id} - {user.full_name}")

    return user


@router.post("/users/invite", status_code=status.HTTP_201_CREATED)
async def create_user_invitation(
    invitation_data: CreateUserInvitationDTO,
    service: UserService = Depends(get_user_service_dependency),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Create a user invitation (whitelist entry)

    Creates a user invitation without password. The invited user will
    complete their registration by setting their password.

    Only ADMIN role can create invitations.

    Args:
        invitation_data: User invitation data (email + role, NO password)
        service: Injected UserService instance
        current_user: Current authenticated user (ADMIN)

    Returns:
        Created user object with invitation status

    Raises:
        HTTPException: If email already exists
    """
    print(f"📨 POST /users/invite - Creating invitation: {invitation_data.email}")
    print(f"   Created by: {current_user.id} ({current_user.email})")

    try:
        result = service.create_invitation(
            email=invitation_data.email,
            full_name=invitation_data.full_name,
            role=invitation_data.role,
            invited_by=current_user.email
        )

        print(f"   ✅ Invitation created: {result['user_id']} - {result['email']} ({result['role']})")
        print(f"   ⏳ Status: Pending registration")

        return result

    except ValueError as e:
        print(f"   ❌ Invitation creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: CreateUserDTO,
    service: UserService = Depends(get_user_service_dependency),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Create a new user (LEGACY - use /users/invite instead)

    This endpoint is kept for backward compatibility.
    New implementations should use POST /users/invite to create invitations.

    Only ADMIN role can create users.

    Args:
        user_data: User creation data
        service: Injected UserService instance
        current_user: Current authenticated user (ADMIN)

    Returns:
        Created user object

    Raises:
        HTTPException: If email already exists
    """
    print(f"📝 POST /users - Creating user: {user_data.email}")
    print(f"   Created by: {current_user.id}")

    try:
        new_user = service.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            role=user_data.role,
            created_by=current_user.id
        )

        print(f"   ✅ User created: {new_user.id} - {new_user.email} ({new_user.role})")

        return new_user

    except ValueError as e:
        print(f"   ❌ User creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_data: UpdateUserDTO,
    service: UserService = Depends(get_user_service_dependency),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Update an existing user

    Only ADMIN role can update users.

    Args:
        user_id: User ID to update
        user_data: User update data
        service: Injected UserService instance
        current_user: Current authenticated user (ADMIN)

    Returns:
        Updated user object

    Raises:
        HTTPException: If user not found or email already exists
    """
    print(f"✏️  PUT /users/{user_id}")
    print(f"   Updated by: {current_user.id}")

    try:
        updated_user = service.update_user(
            user_id=user_id,
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=user_data.is_active
        )

        print(f"   ✅ User {user_id} updated successfully")

        return updated_user

    except ValueError as e:
        print(f"   ❌ User update failed: {str(e)}")
        status_code = status.HTTP_404_NOT_FOUND if "no encontrado" in str(e) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail=str(e)
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    service: UserService = Depends(get_user_service_dependency),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Delete a user

    Only ADMIN role can delete users.
    Cannot delete yourself.

    Args:
        user_id: User ID to delete
        service: Injected UserService instance
        current_user: Current authenticated user (ADMIN)

    Returns:
        Success message

    Raises:
        HTTPException: If user not found or trying to delete self
    """
    print(f"🗑️  DELETE /users/{user_id}")
    print(f"   Deleted by: {current_user.id}")

    try:
        deleted = service.delete_user(user_id, current_user.id)

        if not deleted:
            print(f"   ❌ User not found: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario {user_id} no encontrado"
            )

        print(f"   ✅ User {user_id} deleted successfully")

        return {"message": f"Usuario {user_id} eliminado exitosamente", "deleted_id": user_id}

    except ValueError as e:
        print(f"   ❌ User deletion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
