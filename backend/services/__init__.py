"""
Services Layer

Business logic layer for the application.
Services encapsulate business rules, calculations, and complex operations.

Benefits:
- Testability: Services can be unit tested without HTTP layer
- Reusability: Same logic can be used in API, CLI, background jobs
- Maintainability: Business logic changes don't affect controllers
- Separation of Concerns: Clear separation between HTTP handling and business logic
"""

from backend.services.project_service import ProjectService, get_project_service
from backend.services.auth_service import AuthService, get_auth_service
from backend.services.user_service import UserService, get_user_service
from backend.services.bug_service import BugService, get_bug_service

__all__ = [
    # Service classes
    'ProjectService',
    'AuthService',
    'UserService',
    'BugService',
    # Dependency injection helpers
    'get_project_service',
    'get_auth_service',
    'get_user_service',
    'get_bug_service',
]
