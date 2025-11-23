"""
User data models for authentication and authorization
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class Role(str, Enum):
    """User role enum"""
    ADMIN = "admin"
    QA = "qa"
    DEV = "dev"
    MANAGER = "manager"


class User(BaseModel):
    """User model for authentication and authorization"""
    id: str = Field(..., description="Unique user identifier (e.g., USR-001)")
    email: str = Field(..., description="User email address")
    full_name: str = Field(..., description="User's full name")
    role: Role = Field(..., description="User role (admin, qa, dev, manager)")
    is_active: bool = Field(default=True, description="Whether user is active")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "USR-001",
                "email": "admin@example.com",
                "full_name": "Admin User",
                "role": "admin",
                "is_active": True,
                "created_at": "2025-11-22T10:00:00",
                "last_login": "2025-11-22T14:30:00"
            }
        }


class CreateUserDTO(BaseModel):
    """DTO for creating a new user"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 chars)")
    full_name: str = Field(..., min_length=1, max_length=200, description="User's full name")
    role: Role = Field(..., description="User role")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "newuser@example.com",
                "password": "SecurePass123",
                "full_name": "New User",
                "role": "qa"
            }
        }


class UpdateUserDTO(BaseModel):
    """DTO for updating an existing user (all fields optional)"""
    email: Optional[EmailStr] = Field(None, description="User email address")
    password: Optional[str] = Field(None, min_length=8, description="New password (min 8 chars)")
    full_name: Optional[str] = Field(None, min_length=1, max_length=200, description="User's full name")
    role: Optional[Role] = Field(None, description="User role")
    is_active: Optional[bool] = Field(None, description="Whether user is active")

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Updated Name",
                "role": "dev",
                "is_active": True
            }
        }


class LoginRequest(BaseModel):
    """DTO for login request"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password123"
            }
        }


class LoginResponse(BaseModel):
    """DTO for login response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: dict = Field(..., description="User information")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "USR-001",
                    "email": "user@example.com",
                    "full_name": "User Name",
                    "role": "qa"
                }
            }
        }


# ============================================================================
# Invitation-Based Registration DTOs
# ============================================================================

class CheckEmailRequest(BaseModel):
    """DTO for checking email status in whitelist"""
    email: EmailStr = Field(..., description="Email to check")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@company.com"
            }
        }


class CheckEmailResponse(BaseModel):
    """DTO for email check response"""
    exists: bool = Field(..., description="Whether email exists in whitelist")
    is_registered: bool = Field(..., description="Whether user completed registration")
    full_name: Optional[str] = Field(None, description="User's full name (if registered)")

    class Config:
        json_schema_extra = {
            "example": {
                "exists": True,
                "is_registered": False,
                "full_name": None
            }
        }


class RegisterRequest(BaseModel):
    """DTO for completing user registration (invited user sets password)"""
    email: EmailStr = Field(..., description="User email (must be in whitelist)")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")
    full_name: str = Field(..., min_length=1, max_length=200, description="User's full name")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@company.com",
                "password": "SecurePass123",
                "full_name": "John Doe"
            }
        }


class RegisterResponse(BaseModel):
    """DTO for registration response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: dict = Field(..., description="User information")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "USR-002",
                    "email": "user@company.com",
                    "full_name": "John Doe",
                    "role": "qa",
                    "is_active": True
                }
            }
        }


class CreateUserInvitationDTO(BaseModel):
    """DTO for creating a user invitation (admin-only, NO password)"""
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., min_length=1, max_length=200, description="User's full name")
    role: Role = Field(..., description="User role")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "newuser@company.com",
                "full_name": "New User",
                "role": "qa"
            }
        }
