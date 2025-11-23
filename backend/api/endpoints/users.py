"""
User management endpoints

Supports invitation-based user creation:
- POST /users/invite - Create user invitation (email + role, NO password)
- GET /users - List all users with registration status
- PUT /users/{user_id} - Update user (admin only)
- DELETE /users/{user_id} - Delete user (admin only)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from backend.database import get_db, UserDB
from backend.api.dependencies import (
    get_current_user,
    require_role,
    hash_password
)
from backend.models import User, CreateUserDTO, UpdateUserDTO, CreateUserInvitationDTO, Role

router = APIRouter()


@router.get("/users", response_model=List[User])
async def get_users(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(Role.ADMIN, Role.MANAGER))
):
    """
    Get all users

    Only ADMIN and MANAGER roles can view users.

    Args:
        db: Database session
        current_user: Current authenticated user (ADMIN or MANAGER)

    Returns:
        List of all users
    """
    print(f"📋 GET /users - Requested by: {current_user.id} ({current_user.role})")

    users = db.query(UserDB).all()

    print(f"   Found {len(users)} users")

    return users


@router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(Role.ADMIN, Role.MANAGER))
):
    """
    Get a specific user by ID

    Only ADMIN and MANAGER roles can view user details.

    Args:
        user_id: User ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        User object

    Raises:
        HTTPException: If user not found
    """
    print(f"📋 GET /users/{user_id} - Requested by: {current_user.id}")

    user = db.query(UserDB).filter(UserDB.id == user_id).first()

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
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Create a user invitation (whitelist entry)

    Creates a user invitation without password. The invited user will
    complete their registration by setting their password.

    Only ADMIN role can create invitations.

    Args:
        invitation_data: User invitation data (email + role, NO password)
        db: Database session
        current_user: Current authenticated user (ADMIN)

    Returns:
        Created user object with invitation status

    Raises:
        HTTPException: If email already exists
    """
    print(f"📨 POST /users/invite - Creating invitation: {invitation_data.email}")
    print(f"   Created by: {current_user.id} ({current_user.email})")

    # Check if email already exists
    existing_user = db.query(UserDB).filter(UserDB.email == invitation_data.email).first()
    if existing_user:
        print(f"   ❌ Email already exists: {invitation_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El email {invitation_data.email} ya tiene una invitación"
        )

    # Generate new user ID
    last_user = db.query(UserDB).order_by(UserDB.id.desc()).first()
    if last_user:
        last_num = int(last_user.id.split('-')[1])
        new_id = f"USR-{last_num + 1:03d}"
    else:
        new_id = "USR-001"

    # Create new user invitation (NO password)
    new_user = UserDB(
        id=new_id,
        email=invitation_data.email,
        password_hash=None,  # No password until user registers
        full_name=invitation_data.full_name,
        role=invitation_data.role.value,
        is_active=True,
        is_registered=False,  # Pending registration
        invited_by=current_user.email,
        invited_at=datetime.utcnow(),
        created_by=current_user.id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print(f"   ✅ Invitation created: {new_user.id} - {new_user.email} ({new_user.role})")
    print(f"   ⏳ Status: Pending registration")

    return {
        "message": f"Invitación creada para {new_user.email}",
        "user_id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "status": "pending_registration",
        "invited_by": current_user.email,
        "invited_at": new_user.invited_at.isoformat()
    }


@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: CreateUserDTO,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Create a new user (LEGACY - use /users/invite instead)

    This endpoint is kept for backward compatibility.
    New implementations should use POST /users/invite to create invitations.

    Only ADMIN role can create users.

    Args:
        user_data: User creation data
        db: Database session
        current_user: Current authenticated user (ADMIN)

    Returns:
        Created user object

    Raises:
        HTTPException: If email already exists
    """
    print(f"📝 POST /users - Creating user: {user_data.email}")
    print(f"   Created by: {current_user.id}")

    # Check if email already exists
    existing_user = db.query(UserDB).filter(UserDB.email == user_data.email).first()
    if existing_user:
        print(f"   ❌ Email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El email {user_data.email} ya está registrado"
        )

    # Generate new user ID
    last_user = db.query(UserDB).order_by(UserDB.id.desc()).first()
    if last_user:
        last_num = int(last_user.id.split('-')[1])
        new_id = f"USR-{last_num + 1:03d}"
    else:
        new_id = "USR-001"

    # Hash password
    password_hash = hash_password(user_data.password)

    # Create new user (fully registered)
    new_user = UserDB(
        id=new_id,
        email=user_data.email,
        password_hash=password_hash,
        full_name=user_data.full_name,
        role=user_data.role.value,
        is_active=True,
        is_registered=True,  # Already registered (has password)
        registered_at=datetime.utcnow(),
        invited_by=current_user.email,
        invited_at=datetime.utcnow(),
        created_by=current_user.id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print(f"   ✅ User created: {new_user.id} - {new_user.email} ({new_user.role})")

    return new_user


@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_data: UpdateUserDTO,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Update an existing user

    Only ADMIN role can update users.

    Args:
        user_id: User ID to update
        user_data: User update data
        db: Database session
        current_user: Current authenticated user (ADMIN)

    Returns:
        Updated user object

    Raises:
        HTTPException: If user not found or email already exists
    """
    print(f"✏️  PUT /users/{user_id}")
    print(f"   Updated by: {current_user.id}")

    # Find user
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        print(f"   ❌ User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario {user_id} no encontrado"
        )

    # Update fields
    update_dict = user_data.dict(exclude_unset=True)

    for field, value in update_dict.items():
        if field == "password" and value:
            # Hash new password
            setattr(user, "password_hash", hash_password(value))
            print(f"   Updated password_hash")
        elif field == "email" and value:
            # Check if new email already exists
            existing = db.query(UserDB).filter(
                UserDB.email == value,
                UserDB.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El email {value} ya está en uso"
                )
            setattr(user, field, value)
            print(f"   Updated {field} = {value}")
        elif field == "role":
            setattr(user, field, value.value if value else user.role)
            print(f"   Updated {field} = {value.value if value else user.role}")
        else:
            setattr(user, field, value)
            print(f"   Updated {field} = {value}")

    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    print(f"   ✅ User {user_id} updated successfully")

    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    """
    Delete a user

    Only ADMIN role can delete users.
    Cannot delete yourself.

    Args:
        user_id: User ID to delete
        db: Database session
        current_user: Current authenticated user (ADMIN)

    Returns:
        Success message

    Raises:
        HTTPException: If user not found or trying to delete self
    """
    print(f"🗑️  DELETE /users/{user_id}")
    print(f"   Deleted by: {current_user.id}")

    # Prevent deleting yourself
    if user_id == current_user.id:
        print(f"   ❌ Cannot delete yourself")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo"
        )

    # Find user
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        print(f"   ❌ User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario {user_id} no encontrado"
        )

    # Delete user
    db.delete(user)
    db.commit()

    print(f"   ✅ User {user_id} deleted successfully")

    return {"message": f"Usuario {user_id} eliminado exitosamente", "deleted_id": user_id}
