"""
ID Generation utilities

Centralizes ID generation logic across services while preserving existing formats.

**IMPORTANT**: This module ONLY extracts common logic, it does NOT change ID formats.
Existing IDs in database remain valid.

ID Formats (MUST NOT CHANGE):
- User: USR-XXX (e.g., USR-001)
- Project: PROJ-XXX (e.g., PROJ-001)
- Bug: BUG-{project_id}-XXX (e.g., BUG-PROJ-001-042)
- Test Case: TC-{user_story_id}-XXX (e.g., TC-US-001-001-003)
- User Story: US-XXX-XXX (generated in Excel upload, not here)
"""
from typing import List


def generate_sequential_id(prefix: str, last_record_id: str | None, fallback_number: int = 1) -> str:
    """
    Generate sequential ID with format: PREFIX-XXX

    Used for entities with simple sequential IDs (User, Project).

    Args:
        prefix: ID prefix (e.g., "USR", "PROJ")
        last_record_id: ID of the last record (e.g., "USR-005"), or None if no records exist
        fallback_number: Starting number if no records exist (default: 1)

    Returns:
        New ID with 3-digit zero-padded number (e.g., "USR-006")

    Example:
        >>> generate_sequential_id("USR", "USR-005")
        "USR-006"
        >>> generate_sequential_id("PROJ", None)
        "PROJ-001"
        >>> generate_sequential_id("USR", "USR-099")
        "USR-100"
    """
    if last_record_id and last_record_id.startswith(f"{prefix}-"):
        try:
            last_num = int(last_record_id.split('-')[1])
            return f"{prefix}-{last_num + 1:03d}"
        except (IndexError, ValueError):
            # Fallback if ID format is unexpected
            return f"{prefix}-{fallback_number:03d}"
    else:
        return f"{prefix}-{fallback_number:03d}"


def generate_composite_id(parent_prefix: str, parent_id: str, count: int) -> str:
    """
    Generate composite ID with format: PREFIX-{parent_id}-XXX

    Used for entities that belong to a parent (Bug → Project, TestCase → UserStory).

    Args:
        parent_prefix: Prefix for the child entity (e.g., "BUG", "TC")
        parent_id: Full ID of the parent entity (e.g., "PROJ-001", "US-001-001")
        count: Number of existing children (will be incremented by 1)

    Returns:
        Composite ID (e.g., "BUG-PROJ-001-042", "TC-US-001-001-003")

    Example:
        >>> generate_composite_id("BUG", "PROJ-001", 41)
        "BUG-PROJ-001-042"
        >>> generate_composite_id("TC", "US-001-001", 2)
        "TC-US-001-001-003"
    """
    return f"{parent_prefix}-{parent_id}-{count + 1:03d}"


def check_id_collision(existing_ids: List[str], candidate_id: str) -> bool:
    """
    Check if a candidate ID already exists in the database

    Args:
        existing_ids: List of existing IDs in the database
        candidate_id: Candidate ID to check

    Returns:
        True if collision detected (ID already exists), False otherwise

    Example:
        >>> existing_ids = ["USR-001", "USR-002", "USR-003"]
        >>> check_id_collision(existing_ids, "USR-002")
        True
        >>> check_id_collision(existing_ids, "USR-004")
        False
    """
    return candidate_id in existing_ids
