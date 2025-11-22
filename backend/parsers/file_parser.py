"""
Flexible parser for XLSX and CSV files containing user stories
Supports multiple column naming conventions and formats
"""
import pandas as pd
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import re
from datetime import datetime

from backend.models import UserStory, AcceptanceCriteria, Priority, Status
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.integrations.gemini_client import GeminiClient


class ParseResult:
    """Result of parsing operation"""

    def __init__(self, user_stories: List[UserStory], errors: List[str] = None):
        self.user_stories = user_stories
        self.errors = errors or []
        self.success = len(errors) == 0 if errors else True

    def __len__(self):
        return len(self.user_stories)


class FileParser:
    """
    Flexible parser for user stories from Excel or CSV files
    Automatically detects column names and formats
    """

    # Column name variations (case-insensitive)
    COLUMN_MAPPINGS = {
        "id": ["id", "story_id", "user_story_id", "us_id", "key", "issue_key", "work_item_id"],
        "title": ["title", "summary", "name", "story_name", "user_story", "story_title"],
        "description": [
            "description",
            "desc",
            "details",
            "story",
            "user_story",
            "as_a",
            "narrative",
        ],
        "acceptance_criteria": [
            "acceptance_criteria",
            "acceptance criteria",  # With space
            "acceptancecriteria",   # No space
            "acceptance",
            "criteria",
            "ac",
            "conditions",
            "definition_of_done",
            "definition of done",   # With space
            "dod",
        ],
        "priority": ["priority", "pri", "importance"],
        "status": ["status", "state", "workflow_state"],
        "epic": ["epic", "epic_name", "feature"],
        "sprint": ["sprint", "iteration"],
        "story_points": ["story_points", "points", "estimate", "effort"],
        "assigned_to": ["assigned_to", "assignee", "owner"],
        "work_item_type": ["work_item_type", "type", "item_type", "work_type"],
    }

    def __init__(self, gemini_client=None):
        self.detected_columns: Dict[str, str] = {}
        self.gemini_client = gemini_client  # Optional: for AI-powered criteria extraction

    def parse(self, file_path: str) -> ParseResult:
        """
        Parse user stories from file (XLSX or CSV)

        Args:
            file_path: Path to the file

        Returns:
            ParseResult with list of UserStory objects and any errors
        """
        try:
            # Read file based on extension
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                return ParseResult([], [f"File not found: {file_path}"])

            if file_path_obj.suffix.lower() in [".xlsx", ".xls"]:
                df = pd.read_excel(file_path)
            elif file_path_obj.suffix.lower() == ".csv":
                df = pd.read_csv(file_path)
            else:
                return ParseResult(
                    [], [f"Unsupported file format: {file_path_obj.suffix}"]
                )

            # Detect column mappings
            self._detect_columns(df)

            # Parse each row into UserStory
            user_stories = []
            errors = []

            for idx, row in df.iterrows():
                try:
                    user_story = self._parse_row(row, idx)
                    if user_story:
                        user_stories.append(user_story)
                except Exception as e:
                    errors.append(f"Row {idx + 2}: {str(e)}")  # +2 for header and 0-index

            return ParseResult(user_stories, errors)

        except Exception as e:
            return ParseResult([], [f"Failed to parse file: {str(e)}"])

    async def parse_async(self, file_path: str) -> ParseResult:
        """
        Parse user stories from file with PARALLEL AI processing

        This method processes acceptance criteria extraction in parallel,
        significantly improving performance for large Excel files.

        Args:
            file_path: Path to the file

        Returns:
            ParseResult with list of UserStory objects and any errors
        """
        import asyncio

        try:
            # Read file based on extension
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                return ParseResult([], [f"File not found: {file_path}"])

            if file_path_obj.suffix.lower() in [".xlsx", ".xls"]:
                df = pd.read_excel(file_path)
            elif file_path_obj.suffix.lower() == ".csv":
                df = pd.read_csv(file_path)
            else:
                return ParseResult(
                    [], [f"Unsupported file format: {file_path_obj.suffix}"]
                )

            # Detect column mappings
            self._detect_columns(df)

            # Parse rows WITHOUT AI first (basic parsing)
            print(f"📊 Step 1/2: Basic parsing of {len(df)} rows...")
            user_stories = []
            errors = []

            for idx, row in df.iterrows():
                try:
                    user_story = self._parse_row(row, idx, use_ai=False)  # Disable AI in first pass
                    if user_story:
                        user_stories.append(user_story)
                except Exception as e:
                    errors.append(f"Row {idx + 2}: {str(e)}")

            print(f"✅ Basic parsing complete: {len(user_stories)} stories parsed")

            # If AI client available, refine acceptance criteria IN PARALLEL
            if self.gemini_client and user_stories:
                print(f"🤖 Step 2/2: Refining acceptance criteria with AI (PARALLEL processing)...")

                # Process all stories in parallel
                tasks = []
                for story in user_stories:
                    if story.acceptance_criteria:
                        # Create async task for each story
                        task = self._refine_criteria_async(story)
                        tasks.append(task)

                # Wait for all tasks to complete in parallel
                if tasks:
                    await asyncio.gather(*tasks)
                    print(f"✅ AI refinement complete for {len(tasks)} stories")

            return ParseResult(user_stories, errors)

        except Exception as e:
            return ParseResult([], [f"Failed to parse file: {str(e)}"])

    async def _refine_criteria_async(self, user_story: UserStory):
        """
        Refine acceptance criteria for a single user story using AI (async)

        This method is called in parallel for multiple stories to speed up processing.
        """
        if not user_story.acceptance_criteria:
            return

        # Reconstruct criteria text from parsed criteria
        criteria_text = "\n".join([ac.description for ac in user_story.acceptance_criteria])

        # Check if complex enough for AI
        text_length = len(criteria_text)
        line_count = criteria_text.count('\n')
        has_markdown = '**' in criteria_text or '###' in criteria_text or '![' in criteria_text

        use_ai = (text_length > 500 or line_count > 10 or has_markdown)

        if use_ai:
            print(f"   🤖 Refining story {user_story.id} criteria with AI...")
            ai_criteria = await self.gemini_client.extract_acceptance_criteria_async(criteria_text)

            if ai_criteria and len(ai_criteria) > 0:
                # Replace with refined criteria
                from backend.models import AcceptanceCriteria
                user_story.acceptance_criteria = [
                    AcceptanceCriteria(
                        id=f"AC-{i + 1}",
                        description=description,
                        completed=False
                    )
                    for i, description in enumerate(ai_criteria)
                ]
                print(f"   ✅ Story {user_story.id}: Refined to {len(ai_criteria)} criteria")

    def _detect_columns(self, df: pd.DataFrame):
        """Detect which columns map to our model fields"""
        self.detected_columns = {}
        df_columns_lower = {col.lower(): col for col in df.columns}

        print(f"🔍 Excel columns found: {list(df.columns)}")

        for field, variations in self.COLUMN_MAPPINGS.items():
            for variation in variations:
                if variation.lower() in df_columns_lower:
                    self.detected_columns[field] = df_columns_lower[variation.lower()]
                    print(f"✅ Mapped '{field}' -> Excel column '{df_columns_lower[variation.lower()]}'")
                    break

    def _parse_row(self, row: pd.Series, row_idx: int, use_ai: bool = True) -> Optional[UserStory]:
        """Parse a single row into a UserStory object

        Args:
            row: Pandas Series representing a row from the Excel/CSV
            row_idx: Row index for auto-generating IDs
            use_ai: Whether to use AI for acceptance criteria extraction (default True)
        """

        # Check if it's an Epic (skip Epics, only parse User Stories)
        work_item_type = self._get_value(row, "work_item_type")
        if work_item_type and "epic" in work_item_type.lower():
            # Skip Epics - we only want User Stories
            return None

        # Get ID (required)
        story_id = self._get_value(row, "id")
        if not story_id or pd.isna(story_id):
            story_id = f"US-{row_idx + 1:03d}"  # Auto-generate if missing

        # Get title (required)
        title = self._get_value(row, "title")
        if not title or pd.isna(title):
            raise ValueError("Missing title")

        # Get description (required)
        description = self._get_value(row, "description") or ""

        # Parse acceptance criteria
        acceptance_criteria = self._parse_acceptance_criteria(
            self._get_value(row, "acceptance_criteria"),
            use_ai=use_ai
        )

        # Parse priority
        priority = self._parse_priority(self._get_value(row, "priority"))

        # Parse status
        status = self._parse_status(self._get_value(row, "status"))

        # Optional fields
        epic = self._get_value(row, "epic")
        sprint = self._get_value(row, "sprint")
        story_points = self._parse_int(self._get_value(row, "story_points"))
        assigned_to = self._get_value(row, "assigned_to")

        # Create UserStory
        return UserStory(
            id=str(story_id),
            title=str(title),
            description=str(description),
            acceptance_criteria=acceptance_criteria,
            priority=priority,
            status=status,
            epic=epic,
            sprint=sprint,
            story_points=story_points,
            assigned_to=assigned_to,
            created_date=datetime.now(),
            raw_data=row.to_dict(),
        )

    def _get_value(self, row: pd.Series, field: str) -> Optional[str]:
        """Get value from row using detected column name"""
        if field in self.detected_columns:
            value = row[self.detected_columns[field]]
            if pd.isna(value):
                return None
            return str(value).strip()
        return None

    def _parse_acceptance_criteria(
        self, criteria_text: Optional[str], use_ai: bool = True
    ) -> List[AcceptanceCriteria]:
        """Parse acceptance criteria from text

        Args:
            criteria_text: Raw text containing acceptance criteria
            use_ai: Whether to use AI for extraction (default True)
        """
        if not criteria_text or pd.isna(criteria_text):
            print(f"⚠️  No acceptance criteria text provided (empty or NaN)")
            return []

        print(f"📝 Parsing acceptance criteria: {criteria_text[:100]}...")

        criteria_list = []

        # Check if text is complex (has markdown, many lines, formatting)
        text_length = len(criteria_text)
        line_count = criteria_text.count('\n')
        has_markdown = '**' in criteria_text or '###' in criteria_text or '![' in criteria_text

        # Use AI extraction if:
        # 1. AI is enabled via parameter
        # 2. Gemini client is available
        # 3. Text is complex (long, many lines, or has markdown)
        should_use_ai = (
            use_ai and
            self.gemini_client is not None and
            (text_length > 500 or line_count > 10 or has_markdown)
        )

        if should_use_ai:
            print(f"🤖 Using AI to extract criteria (length={text_length}, lines={line_count}, markdown={has_markdown})")
            try:
                ai_criteria = self.gemini_client.extract_acceptance_criteria(criteria_text)

                if ai_criteria and len(ai_criteria) > 0:
                    for i, description in enumerate(ai_criteria):
                        criteria_list.append(
                            AcceptanceCriteria(
                                id=f"AC-{i + 1}",
                                description=description,
                                completed=False
                            )
                        )
                    print(f"✅ AI extracted {len(criteria_list)} clean criteria")
                    return criteria_list
                else:
                    print(f"⚠️  AI returned empty list, falling back to regex parser")
            except Exception as e:
                print(f"❌ AI extraction failed: {e}, falling back to regex parser")

        # Fallback: Simple regex-based parsing
        print(f"📋 Using regex parser (simpler format detected)")

        # Try to split by common separators
        separators = ["\n", ";", "|"]
        lines = [criteria_text]

        for sep in separators:
            if sep in criteria_text:
                lines = criteria_text.split(sep)
                print(f"✂️  Split by '{repr(sep)}' into {len(lines)} lines")
                break

        # Clean and create AcceptanceCriteria objects
        for i, line in enumerate(lines):
            line = line.strip()
            # Remove common bullet points and numbering
            line = re.sub(r"^[\d\.\-\*\•\→]+\s*", "", line)
            if line and len(line) > 5:  # Skip very short lines
                criteria_list.append(
                    AcceptanceCriteria(
                        id=f"AC-{i + 1}",
                        description=line,
                        completed=False
                    )
                )

        print(f"✅ Parsed {len(criteria_list)} acceptance criteria")
        return criteria_list

    def _parse_priority(self, priority_text: Optional[str]) -> Priority:
        """Parse priority from text"""
        if not priority_text:
            return Priority.MEDIUM

        priority_text = priority_text.lower().strip()

        if "critical" in priority_text or priority_text == "1":
            return Priority.CRITICAL
        elif "high" in priority_text or priority_text == "2":
            return Priority.HIGH
        elif "low" in priority_text or priority_text == "4":
            return Priority.LOW
        else:
            return Priority.MEDIUM

    def _parse_status(self, status_text: Optional[str]) -> Status:
        """Parse status from text"""
        if not status_text:
            return Status.BACKLOG

        status_text = status_text.lower().strip()

        status_map = {
            "backlog": Status.BACKLOG,
            "to do": Status.TODO,
            "todo": Status.TODO,
            "in progress": Status.IN_PROGRESS,
            "in_progress": Status.IN_PROGRESS,
            "progress": Status.IN_PROGRESS,
            "in review": Status.IN_REVIEW,
            "review": Status.IN_REVIEW,
            "testing": Status.TESTING,
            "test": Status.TESTING,
            "qa": Status.TESTING,
            "done": Status.DONE,
            "completed": Status.DONE,
            "closed": Status.DONE,
        }

        return status_map.get(status_text, Status.BACKLOG)

    def _parse_int(self, value: Optional[str]) -> Optional[int]:
        """Safely parse integer from string"""
        if not value or pd.isna(value):
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None

    def get_detected_columns_info(self) -> Dict[str, str]:
        """Get information about detected columns for debugging"""
        return self.detected_columns.copy()

    @staticmethod
    def create_template_excel(output_path: str):
        """Create a template Excel file for user stories"""
        template_data = {
            "ID": ["US-001", "US-002", "US-003"],
            "Title": [
                "User login with email and password",
                "User can reset password",
                "User can update profile information",
            ],
            "Description": [
                "As a user, I want to login with my email and password so that I can access my account",
                "As a user, I want to reset my password if I forget it so that I can regain access",
                "As a user, I want to update my profile information so that my data stays current",
            ],
            "Acceptance Criteria": [
                "- User can enter email and password\n- System validates credentials\n- Successful login redirects to dashboard\n- Failed login shows error message",
                "- User can request password reset link\n- Email is sent with reset link\n- Link expires after 24 hours\n- User can set new password",
                "- User can edit name, email, and phone\n- Changes are validated\n- User sees confirmation message\n- Data is updated in database",
            ],
            "Priority": ["High", "Medium", "Medium"],
            "Status": ["To Do", "Backlog", "Backlog"],
            "Epic": ["Authentication", "Authentication", "User Management"],
            "Sprint": ["Sprint 1", "", ""],
            "Story Points": [5, 3, 2],
            "Assigned To": ["", "", ""],
        }

        df = pd.DataFrame(template_data)
        df.to_excel(output_path, index=False)
        print(f"Template created at: {output_path}")
