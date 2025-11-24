"""
Authentication Service Layer

Handles business logic for authentication operations following SOLID principles:
- Single Responsibility: Only handles auth-related business logic
- Dependency Inversion: Depends on Session abstraction, not concrete DB implementation
- Open/Closed: Easy to extend with new auth operations without modifying existing code
"""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime
from passlib.context import CryptContext

from backend.database import UserDB, OrganizationDB
from backend.api.dependencies import create_access_token
from backend.models import Role


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """
    Service class for authentication-related business logic

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

    def check_email(self, email: str) -> Dict[str, Any]:
        """
        Check if email exists in whitelist and return registration status

        Args:
            email: Email address to check

        Returns:
            Dictionary with exists, is_registered, and full_name fields
        """
        user = self.db.query(UserDB).filter(UserDB.email == email).first()

        if not user:
            return {
                "exists": False,
                "is_registered": False,
                "full_name": None
            }

        return {
            "exists": True,
            "is_registered": user.is_registered,
            "full_name": user.full_name if user.is_registered else None
        }

    def register_user(
        self,
        email: str,
        password: str,
        full_name: str
    ) -> Dict[str, Any]:
        """
        Complete user registration (invited user sets password)

        Args:
            email: User email
            password: User password (plain text, will be hashed)
            full_name: User full name

        Returns:
            Dictionary with access_token, token_type, and user info

        Raises:
            ValueError: If email not in whitelist or already registered
        """
        # 1. Validate email exists in whitelist
        user = self.db.query(UserDB).filter(UserDB.email == email).first()

        if not user:
            raise ValueError("Este email no tiene una invitación válida. Contacta al administrador.")

        # 2. Validate user is NOT already registered
        if user.is_registered:
            raise ValueError("Este usuario ya completó su registro. Usa el login normal.")

        # 3. Hash password and complete registration
        user.password_hash = self._hash_password(password)
        user.full_name = full_name
        user.is_registered = True
        user.registered_at = datetime.utcnow()
        user.last_login = datetime.utcnow()

        self.db.commit()
        self.db.refresh(user)

        # 4. Create access token (auto-login after registration)
        access_token = create_access_token(user.id, user.role)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": self._user_to_dict(user)
        }

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        User login with email and password

        Args:
            email: User email
            password: User password (plain text)

        Returns:
            Dictionary with access_token, token_type, and user info

        Raises:
            ValueError: If credentials are invalid, user not registered, or user inactive
        """
        # 1. Find user by email
        user = self.db.query(UserDB).filter(UserDB.email == email).first()

        if not user:
            raise ValueError("Email o contraseña incorrectos")

        # 2. Check if user completed registration
        if not user.is_registered:
            raise ValueError("Debes completar tu registro antes de iniciar sesión")

        # 3. Verify password
        if not user.password_hash or not self._verify_password(password, user.password_hash):
            raise ValueError("Email o contraseña incorrectos")

        # 4. Check if user is active
        if not user.is_active:
            raise ValueError("Usuario inactivo. Contacte al administrador.")

        # 5. Create access token
        access_token = create_access_token(user.id, user.role)

        # 6. Update last_login
        user.last_login = datetime.utcnow()
        self.db.commit()

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": self._user_to_dict(user)
        }

    def get_user_info(self, user_id: str) -> Dict[str, Any]:
        """
        Get current authenticated user information

        Args:
            user_id: User ID

        Returns:
            User information dictionary

        Raises:
            ValueError: If user not found
        """
        user = self.db.query(UserDB).filter(UserDB.id == user_id).first()

        if not user:
            raise ValueError(f"User {user_id} not found")

        # Get organization name
        organization = self.db.query(OrganizationDB).filter(
            OrganizationDB.id == user.organization_id
        ).first()

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
            "organization_name": organization.name if organization else None,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }

    # ========== Private Helper Methods ==========

    def _hash_password(self, password: str) -> str:
        """Hash a plain text password"""
        return pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain text password against a hashed password"""
        return pwd_context.verify(plain_password, hashed_password)

    def _user_to_dict(self, user: UserDB) -> Dict[str, Any]:
        """Convert UserDB to dictionary with organization info"""
        # Get organization name
        organization = self.db.query(OrganizationDB).filter(
            OrganizationDB.id == user.organization_id
        ).first()

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
            "organization_name": organization.name if organization else None,
            "is_active": user.is_active,
        }


# ========== Dependency Injection Helper ==========

def get_auth_service(db: Session) -> AuthService:
    """
    Dependency injection helper for FastAPI

    Usage in endpoint:
        @router.post("/auth/login")
        async def login(
            service: AuthService = Depends(get_auth_service_dependency)
        ):
            return service.login_user(email, password)
    """
    return AuthService(db)
