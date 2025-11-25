"""
Security utilities for password hashing and verification

Centralized password hashing to eliminate code duplication across:
- api/dependencies.py
- services/auth_service.py
- setup_database.py

Uses bcrypt for secure password hashing.
"""
import bcrypt


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt

    Args:
        password: Plain text password

    Returns:
        Hashed password string

    Example:
        >>> hashed = hash_password("my_password")
        >>> verify_password("my_password", hashed)
        True
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(password: str, hashed: str) -> bool:
    """
    Verify password against hash

    Args:
        password: Plain text password
        hashed: Hashed password from database

    Returns:
        True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("correct_password")
        >>> verify_password("correct_password", hashed)
        True
        >>> verify_password("wrong_password", hashed)
        False
    """
    return bcrypt.checkpw(password.encode(), hashed.encode())
