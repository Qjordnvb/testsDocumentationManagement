"""
User Service Layer

Handles business logic for user management operations following SOLID principles:
- Single Responsibility: Only handles user-related business logic
- Dependency Inversion: Depends on Session abstraction, not concrete DB implementation
- Open/Closed: Easy to extend with new user operations without modifying existing code
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.database import UserDB
from backend.api.dependencies import hash_password
from backend.models import Role


class UserService:
    """
    Service class for user-related business logic

    Benefits of service layer:
    1. Testability: Can unit test business logic without HTTP server
    2. Reusability: Same logic can be used in API, CLI, background jobs
    3. Separation of Concerns: Business logic separate from HTTP handling
    4. Maintainability: Changes to business logic don't affect API layer
    """

    def __init__(self, db: Session):
        """
        Initialize service with database session

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def get_all_users(self, organization_id: str) -> List[UserDB]:
        """
        Get all users from a specific organization

        Args:
            organization_id: Organization ID to filter by

        Returns:
            List of users from the specified organization only
        """
        return self.db.query(UserDB).filter(
            UserDB.organization_id == organization_id
        ).all()

    def get_user_by_id(self, user_id: str) -> Optional[UserDB]:
        """
        Get a specific user by ID

        Args:
            user_id: User ID

        Returns:
            User object or None if not found
        """
        return self.db.query(UserDB).filter(UserDB.id == user_id).first()

    def create_invitation(
        self,
        email: str,
        full_name: str,
        role: Role,
        invited_by: str,
        organization_id: str
    ) -> Dict[str, Any]:
        """
        Create a user invitation (whitelist entry)

        Creates a user invitation without password. The invited user will
        complete their registration by setting their password.

        Args:
            email: User email
            full_name: User full name
            role: User role
            invited_by: Email of the admin who created the invitation
            organization_id: Organization ID to assign the user to

        Returns:
            Dictionary with invitation details

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists (globally, across all organizations)
        existing_user = self.db.query(UserDB).filter(UserDB.email == email).first()
        if existing_user:
            raise ValueError(f"El email {email} ya tiene una invitación")

        # Generate new user ID
        new_id = self._generate_unique_user_id()

        # Create new user invitation (NO password)
        new_user = UserDB(
            id=new_id,
            email=email,
            password_hash=None,  # No password until user registers
            full_name=full_name,
            role=role.value,
            organization_id=organization_id,  # Assign to admin's organization
            is_active=True,
            is_registered=False,  # Pending registration
            invited_by=invited_by,
            invited_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        return {
            "message": f"Invitación creada para {new_user.email}",
            "user_id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "organization_id": new_user.organization_id,
            "status": "pending_registration",
            "invited_by": invited_by,
            "invited_at": new_user.invited_at.isoformat()
        }

    def create_user(
        self,
        email: str,
        password: str,
        full_name: str,
        role: Role,
        organization_id: str
    ) -> UserDB:
        """
        Create a new user (LEGACY - use create_invitation instead)

        This method is kept for backward compatibility.

        Args:
            email: User email
            password: User password (plain text, will be hashed)
            full_name: User full name
            role: User role
            organization_id: Organization ID to assign the user to

        Returns:
            Created user object

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing_user = self.db.query(UserDB).filter(UserDB.email == email).first()
        if existing_user:
            raise ValueError(f"El email {email} ya está registrado")

        # Generate new user ID
        new_id = self._generate_unique_user_id()

        # Hash password
        password_hash = hash_password(password)

        # Create new user (fully registered)
        new_user = UserDB(
            id=new_id,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=role.value,
            organization_id=organization_id,  # Assign to admin's organization
            is_active=True,
            is_registered=True,  # Already registered (has password)
            invited_by=None,  # Direct creation, not invited
            invited_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        return new_user

    def update_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        password: Optional[str] = None,
        full_name: Optional[str] = None,
        role: Optional[Role] = None,
        is_active: Optional[bool] = None
    ) -> UserDB:
        """
        Update an existing user

        Args:
            user_id: User ID to update
            email: New email (optional)
            password: New password (optional, plain text, will be hashed)
            full_name: New full name (optional)
            role: New role (optional)
            is_active: New active status (optional)

        Returns:
            Updated user object

        Raises:
            ValueError: If user not found or email already exists
        """
        # Find user
        user = self.db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise ValueError(f"Usuario {user_id} no encontrado")

        # Update fields
        if password:
            user.password_hash = hash_password(password)

        if email:
            # Check if new email already exists
            existing = self.db.query(UserDB).filter(
                UserDB.email == email,
                UserDB.id != user_id
            ).first()
            if existing:
                raise ValueError(f"El email {email} ya está en uso")
            user.email = email

        if full_name is not None:
            user.full_name = full_name

        if role is not None:
            user.role = role.value

        if is_active is not None:
            user.is_active = is_active

        user.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(user)

        return user

    def delete_user(self, user_id: str, current_user_id: str) -> bool:
        """
        Delete a user

        Args:
            user_id: User ID to delete
            current_user_id: ID of the current user (to prevent self-deletion)

        Returns:
            True if deleted, False if not found

        Raises:
            ValueError: If trying to delete self
        """
        # Prevent deleting yourself
        if user_id == current_user_id:
            raise ValueError("No puedes eliminarte a ti mismo")

        # Find user
        user = self.db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            return False

        # Delete user
        self.db.delete(user)
        self.db.commit()

        return True

    # ========== Private Helper Methods ==========

    def _generate_unique_user_id(self) -> str:
        """Generate a unique user ID in format USR-001"""
        last_user = self.db.query(UserDB).order_by(UserDB.id.desc()).first()
        if last_user:
            last_num = int(last_user.id.split('-')[1])
            new_id = f"USR-{last_num + 1:03d}"
        else:
            new_id = "USR-001"

        # Handle edge case: ID collision (shouldn't happen but be defensive)
        while self.db.query(UserDB).filter(UserDB.id == new_id).first():
            last_num += 1
            new_id = f"USR-{last_num + 1:03d}"

        return new_id


# ========== Dependency Injection Helper ==========

def get_user_service(db: Session) -> UserService:
    """
    Dependency injection helper for FastAPI

    Usage in endpoint:
        @router.get("/users")
        async def get_users(
            service: UserService = Depends(get_user_service_dependency)
        ):
            return service.get_all_users()
    """
    return UserService(db)
