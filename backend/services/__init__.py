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

__all__ = [
    'ProjectService',
    'get_project_service',
]
