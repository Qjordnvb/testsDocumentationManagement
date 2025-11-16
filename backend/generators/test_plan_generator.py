"""
Test Plan document generator (Markdown and PDF)
"""
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime
import markdown
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from backend.models import UserStory, TestCase, TestType, TestPriority


class TestPlanGenerator:
    """Generator for comprehensive test plans"""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles for PDF"""
        # Title style
        self.styles.add(
            ParagraphStyle(
                name="CustomTitle",
                parent=self.styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1a1a1a"),
                spaceAfter=30,
                alignment=TA_CENTER,
            )
        )

        # Section header style
        self.styles.add(
            ParagraphStyle(
                name="SectionHeader",
                parent=self.styles["Heading2"],
                fontSize=16,
                textColor=colors.HexColor("#2c3e50"),
                spaceAfter=12,
                spaceBefore=12,
            )
        )

    def generate_test_plan(
        self,
        user_stories: List[UserStory],
        test_cases: List[TestCase],
        output_dir: str,
        project_name: str,
        format: str = "both",  # markdown, pdf, or both
    ) -> Dict[str, str]:
        """
        Generate comprehensive test plan

        Args:
            user_stories: List of UserStory objects
            test_cases: List of TestCase objects
            output_dir: Output directory
            project_name: Name of the project
            format: Output format (markdown, pdf, or both)

        Returns:
            Dictionary with paths to generated files
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        generated_files = {}

        # Generate markdown
        if format in ["markdown", "both"]:
            markdown_path = self._generate_markdown(
                user_stories, test_cases, output_path, project_name
            )
            generated_files["markdown"] = markdown_path

        # Generate PDF
        if format in ["pdf", "both"]:
            pdf_path = self._generate_pdf(
                user_stories, test_cases, output_path, project_name
            )
            generated_files["pdf"] = pdf_path

        return generated_files

    def _generate_markdown(
        self,
        user_stories: List[UserStory],
        test_cases: List[TestCase],
        output_path: Path,
        project_name: str,
    ) -> str:
        """Generate markdown test plan"""

        # Build markdown content
        lines = [
            f"# Test Plan: {project_name}",
            "",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
            "---",
            "",
            "## 1. Introduction",
            "",
            f"This test plan outlines the testing strategy and approach for {project_name}.",
            "It covers functional, integration, and other types of testing required to ensure quality.",
            "",
            "## 2. Test Scope",
            "",
            f"**Total User Stories:** {len(user_stories)}",
            f"**Total Test Cases:** {len(test_cases)}",
            "",
            "### 2.1 Features to be Tested",
            "",
        ]

        # List user stories
        for us in user_stories:
            lines.append(
                f"- **{us.id}**: {us.title} (Priority: {us.priority.value if us.priority else 'N/A'})"
            )

        lines.extend([
            "",
            "## 3. Test Strategy",
            "",
            "### 3.1 Test Types",
            "",
        ])

        # Analyze test types
        test_type_counts = self._count_test_types(test_cases)
        for test_type, count in test_type_counts.items():
            lines.append(f"- **{test_type}**: {count} test cases")

        lines.extend([
            "",
            "### 3.2 Test Levels",
            "",
            "1. **Unit Testing**: Individual component testing",
            "2. **Integration Testing**: Component interaction testing",
            "3. **System Testing**: End-to-end system testing",
            "4. **Acceptance Testing**: User acceptance criteria validation",
            "",
            "## 4. Test Cases Summary",
            "",
            "| Test ID | Title | Type | Priority | User Story |",
            "|---------|-------|------|----------|------------|",
        ])

        # Add test cases table
        for tc in test_cases:
            lines.append(
                f"| {tc.id} | {tc.title} | {tc.test_type.value} | "
                f"{tc.priority.value} | {tc.user_story_id} |"
            )

        lines.extend([
            "",
            "## 5. Test Environment",
            "",
            "### 5.1 Hardware Requirements",
            "- Standard development workstations",
            "- Mobile devices for mobile testing (if applicable)",
            "",
            "### 5.2 Software Requirements",
            "- Operating Systems: Windows, macOS, Linux",
            "- Browsers: Chrome, Firefox, Safari, Edge (latest versions)",
            "- Test automation tools (if applicable)",
            "",
            "## 6. Test Schedule",
            "",
            "| Phase | Activities | Duration |",
            "|-------|-----------|----------|",
            "| Test Planning | Create test cases, review | 1 week |",
            "| Test Execution | Run test cases, log defects | 2 weeks |",
            "| Regression Testing | Re-test fixed defects | 1 week |",
            "| Test Closure | Final reports, sign-off | 2 days |",
            "",
            "## 7. Entry and Exit Criteria",
            "",
            "### 7.1 Entry Criteria",
            "- All user stories are implemented",
            "- Test environment is set up and accessible",
            "- Test data is prepared",
            "- Test cases are reviewed and approved",
            "",
            "### 7.2 Exit Criteria",
            "- All planned test cases are executed",
            "- Critical and high-priority defects are fixed",
            "- Test coverage meets the defined threshold (90%+)",
            "- Test summary report is approved",
            "",
            "## 8. Defect Management",
            "",
            "### 8.1 Defect Severity Levels",
            "- **Critical**: System crash, data loss, security breach",
            "- **High**: Major functionality broken",
            "- **Medium**: Feature partially works",
            "- **Low**: Minor issues, cosmetic problems",
            "",
            "### 8.2 Defect Tracking",
            "- All defects will be logged in the project management system",
            "- Defects will be prioritized and assigned to developers",
            "- Re-testing will be performed after fixes",
            "",
            "## 9. Risks and Mitigation",
            "",
            "| Risk | Impact | Mitigation Strategy |",
            "|------|--------|---------------------|",
            "| Incomplete requirements | High | Regular stakeholder reviews |",
            "| Resource unavailability | Medium | Backup resource planning |",
            "| Environment issues | Medium | Early environment setup and validation |",
            "| Schedule delays | High | Buffer time in schedule, parallel testing |",
            "",
            "## 10. Deliverables",
            "",
            "- Test Plan document (this document)",
            "- Test Cases with Gherkin scenarios",
            "- Test Execution Reports",
            "- Defect Reports",
            "- Test Summary Report",
            "",
            "## 11. Approvals",
            "",
            "| Role | Name | Signature | Date |",
            "|------|------|-----------|------|",
            "| QA Lead | _______________ | _______________ | _______ |",
            "| Project Manager | _______________ | _______________ | _______ |",
            "| Product Owner | _______________ | _______________ | _______ |",
            "",
            "---",
            "",
            f"*Document generated automatically by QA Documentation Automation System*",
        ])

        markdown_content = "\n".join(lines)

        # Save markdown file
        markdown_file = output_path / f"TestPlan_{project_name}_{datetime.now().strftime('%Y%m%d')}.md"
        with open(markdown_file, "w", encoding="utf-8") as f:
            f.write(markdown_content)

        return str(markdown_file)

    def _generate_pdf(
        self,
        user_stories: List[UserStory],
        test_cases: List[TestCase],
        output_path: Path,
        project_name: str,
    ) -> str:
        """Generate PDF test plan"""

        pdf_file = (
            output_path / f"TestPlan_{project_name}_{datetime.now().strftime('%Y%m%d')}.pdf"
        )

        # Create PDF document
        doc = SimpleDocTemplate(
            str(pdf_file),
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        # Container for the 'Flowable' objects
        elements = []

        # Title
        elements.append(Paragraph(f"Test Plan: {project_name}", self.styles["CustomTitle"]))
        elements.append(
            Paragraph(
                f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                self.styles["Normal"],
            )
        )
        elements.append(Spacer(1, 0.3 * inch))

        # Section 1: Introduction
        elements.append(Paragraph("1. Introduction", self.styles["SectionHeader"]))
        elements.append(
            Paragraph(
                f"This test plan outlines the testing strategy and approach for {project_name}.",
                self.styles["Normal"],
            )
        )
        elements.append(Spacer(1, 0.2 * inch))

        # Section 2: Test Scope
        elements.append(Paragraph("2. Test Scope", self.styles["SectionHeader"]))
        elements.append(
            Paragraph(f"<b>Total User Stories:</b> {len(user_stories)}", self.styles["Normal"])
        )
        elements.append(
            Paragraph(f"<b>Total Test Cases:</b> {len(test_cases)}", self.styles["Normal"])
        )
        elements.append(Spacer(1, 0.2 * inch))

        # User Stories Table
        elements.append(Paragraph("2.1 Features to be Tested", self.styles["Heading3"]))
        us_data = [["ID", "Title", "Priority"]]
        for us in user_stories[:10]:  # Limit to first 10 for space
            us_data.append([
                us.id,
                us.title[:50] + "..." if len(us.title) > 50 else us.title,
                us.priority.value if us.priority else "N/A",
            ])

        us_table = Table(us_data, colWidths=[1 * inch, 4 * inch, 1 * inch])
        us_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ])
        )
        elements.append(us_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Section 3: Test Strategy
        elements.append(Paragraph("3. Test Strategy", self.styles["SectionHeader"]))
        test_type_counts = self._count_test_types(test_cases)
        for test_type, count in test_type_counts.items():
            elements.append(Paragraph(f"• <b>{test_type}:</b> {count} test cases", self.styles["Normal"]))
        elements.append(Spacer(1, 0.2 * inch))

        # Test Cases Summary Table
        elements.append(Paragraph("4. Test Cases Summary", self.styles["SectionHeader"]))
        tc_data = [["Test ID", "Title", "Type", "Priority"]]
        for tc in test_cases[:15]:  # Limit for space
            tc_data.append([
                tc.id,
                tc.title[:40] + "..." if len(tc.title) > 40 else tc.title,
                tc.test_type.value,
                tc.priority.value,
            ])

        tc_table = Table(tc_data, colWidths=[0.8 * inch, 3 * inch, 1 * inch, 0.8 * inch])
        tc_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ])
        )
        elements.append(tc_table)

        # Build PDF
        doc.build(elements)

        return str(pdf_file)

    def _count_test_types(self, test_cases: List[TestCase]) -> Dict[str, int]:
        """Count test cases by type"""
        counts = {}
        for tc in test_cases:
            test_type = tc.test_type.value
            counts[test_type] = counts.get(test_type, 0) + 1
        return dict(sorted(counts.items()))

    def generate_test_metrics_report(
        self, test_cases: List[TestCase], output_dir: str
    ) -> str:
        """
        Generate test metrics and statistics report

        Args:
            test_cases: List of TestCase objects
            output_dir: Output directory

        Returns:
            Path to generated report
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Calculate metrics
        total_tests = len(test_cases)
        passed = sum(1 for tc in test_cases if tc.status.value == "Passed")
        failed = sum(1 for tc in test_cases if tc.status.value == "Failed")
        not_run = sum(1 for tc in test_cases if tc.status.value == "Not Run")
        blocked = sum(1 for tc in test_cases if tc.status.value == "Blocked")

        pass_rate = (passed / total_tests * 100) if total_tests > 0 else 0

        # Build report
        lines = [
            "# Test Metrics Report",
            "",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
            "## Test Execution Summary",
            "",
            f"- **Total Test Cases:** {total_tests}",
            f"- **Passed:** {passed} ({passed / total_tests * 100:.1f}%)" if total_tests > 0 else "- **Passed:** 0",
            f"- **Failed:** {failed} ({failed / total_tests * 100:.1f}%)" if total_tests > 0 else "- **Failed:** 0",
            f"- **Not Run:** {not_run} ({not_run / total_tests * 100:.1f}%)" if total_tests > 0 else "- **Not Run:** 0",
            f"- **Blocked:** {blocked} ({blocked / total_tests * 100:.1f}%)" if total_tests > 0 else "- **Blocked:** 0",
            "",
            f"**Pass Rate:** {pass_rate:.1f}%",
            "",
            "## Test Distribution by Type",
            "",
        ]

        test_type_counts = self._count_test_types(test_cases)
        for test_type, count in test_type_counts.items():
            percentage = (count / total_tests * 100) if total_tests > 0 else 0
            lines.append(f"- **{test_type}:** {count} ({percentage:.1f}%)")

        report_content = "\n".join(lines)

        # Save report
        report_file = output_path / f"TestMetrics_{datetime.now().strftime('%Y%m%d_%H%M')}.md"
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(report_content)

        return str(report_file)
