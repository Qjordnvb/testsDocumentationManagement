"""
CLI interface for QA Documentation Automation
"""
import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint
from pathlib import Path
from typing import Optional

from src.config import settings
from src.parsers import FileParser
from src.generators import GherkinGenerator, TestPlanGenerator, BugReportGenerator
from src.integrations import GeminiClient
from src.database import init_db, SessionLocal, UserStoryDB, TestCaseDB
from src.models import UserStory

app = typer.Typer(
    name="qa-auto",
    help="QA Documentation Automation CLI",
    add_completion=False
)
console = Console()


@app.command()
def init():
    """Initialize the database and directories"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        progress.add_task(description="Initializing...", total=None)

        settings.ensure_directories()
        init_db()

    console.print("\n[green]✓[/green] Database and directories initialized successfully!")
    console.print(f"[blue]Output directory:[/blue] {settings.output_dir}")
    console.print(f"[blue]Upload directory:[/blue] {settings.upload_dir}")


@app.command()
def parse(
    file_path: str = typer.Argument(..., help="Path to XLSX or CSV file"),
    save_to_db: bool = typer.Option(True, help="Save parsed stories to database")
):
    """Parse user stories from XLSX/CSV file"""
    console.print(f"\n[blue]Parsing file:[/blue] {file_path}")

    parser = FileParser()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task(description="Parsing file...", total=None)
        result = parser.parse(file_path)

    if not result.success:
        console.print("\n[red]✗ Parse errors:[/red]")
        for error in result.errors:
            console.print(f"  [red]•[/red] {error}")
        raise typer.Exit(1)

    # Display results
    console.print(f"\n[green]✓[/green] Successfully parsed {len(result)} user stories")

    # Create table
    table = Table(title="Parsed User Stories")
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="white")
    table.add_column("Priority", style="yellow")
    table.add_column("Status", style="green")

    for story in result.user_stories:
        table.add_row(
            story.id,
            story.title[:50] + "..." if len(story.title) > 50 else story.title,
            story.priority.value if story.priority else "N/A",
            story.status.value if story.status else "N/A"
        )

    console.print("\n")
    console.print(table)

    # Save to database
    if save_to_db:
        db = SessionLocal()
        try:
            for user_story in result.user_stories:
                db_story = UserStoryDB(
                    id=user_story.id,
                    title=user_story.title,
                    description=user_story.description,
                    priority=user_story.priority,
                    status=user_story.status,
                    epic=user_story.epic,
                    sprint=user_story.sprint,
                    story_points=user_story.story_points,
                    assigned_to=user_story.assigned_to,
                    total_criteria=len(user_story.acceptance_criteria),
                )
                db.merge(db_story)
            db.commit()
            console.print("\n[green]✓[/green] Saved to database")
        finally:
            db.close()


@app.command()
def generate_tests(
    story_id: str = typer.Argument(..., help="User story ID"),
    use_ai: bool = typer.Option(True, help="Use AI to generate scenarios"),
    num_scenarios: int = typer.Option(3, help="Number of scenarios to generate")
):
    """Generate test cases for a user story"""
    console.print(f"\n[blue]Generating test cases for:[/blue] {story_id}")

    # Get user story from database
    db = SessionLocal()
    try:
        story_db = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
        if not story_db:
            console.print(f"[red]✗ User story {story_id} not found in database[/red]")
            raise typer.Exit(1)

        user_story = UserStory(
            id=story_db.id,
            title=story_db.title,
            description=story_db.description,
            priority=story_db.priority,
            status=story_db.status
        )
    finally:
        db.close()

    # Generate scenarios
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        if use_ai:
            progress.add_task(description="Generating scenarios with AI...", total=None)
            gemini_client = GeminiClient(api_key=settings.gemini_api_key)
            gherkin_gen = GherkinGenerator(gemini_client)
        else:
            progress.add_task(description="Generating basic scenarios...", total=None)
            gherkin_gen = GherkinGenerator()

        settings.ensure_directories()
        gherkin_file = gherkin_gen.generate_from_user_story(
            user_story=user_story,
            output_dir=settings.output_dir,
            use_ai=use_ai,
            num_scenarios=num_scenarios
        )

    console.print(f"\n[green]✓[/green] Test scenarios generated successfully!")
    console.print(f"[blue]File:[/blue] {gherkin_file}")


@app.command()
def generate_plan(
    project_name: str = typer.Argument(..., help="Project name"),
    format: str = typer.Option("both", help="Output format: markdown, pdf, or both")
):
    """Generate test plan document"""
    console.print(f"\n[blue]Generating test plan for:[/blue] {project_name}")

    # Get data from database
    db = SessionLocal()
    try:
        user_stories_db = db.query(UserStoryDB).all()
        test_cases_db = db.query(TestCaseDB).all()

        user_stories = [
            UserStory(
                id=s.id,
                title=s.title,
                description=s.description,
                priority=s.priority,
                status=s.status
            )
            for s in user_stories_db
        ]

        from src.models import TestCase
        test_cases = [
            TestCase(
                id=tc.id,
                title=tc.title,
                description=tc.description,
                user_story_id=tc.user_story_id,
                test_type=tc.test_type,
                priority=tc.priority,
                status=tc.status
            )
            for tc in test_cases_db
        ]
    finally:
        db.close()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        progress.add_task(description="Generating test plan...", total=None)

        settings.ensure_directories()
        test_plan_gen = TestPlanGenerator()
        files = test_plan_gen.generate_test_plan(
            user_stories=user_stories,
            test_cases=test_cases,
            output_dir=settings.output_dir,
            project_name=project_name,
            format=format
        )

    console.print(f"\n[green]✓[/green] Test plan generated successfully!")
    for file_type, file_path in files.items():
        console.print(f"[blue]{file_type.upper()}:[/blue] {file_path}")


@app.command()
def create_template():
    """Create bug report template"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        progress.add_task(description="Creating template...", total=None)

        settings.ensure_directories()
        bug_gen = BugReportGenerator()
        template_path = bug_gen.generate_template(settings.output_dir)

    console.print(f"\n[green]✓[/green] Bug report template created!")
    console.print(f"[blue]File:[/blue] {template_path}")


@app.command()
def list_stories():
    """List all user stories in database"""
    db = SessionLocal()
    try:
        stories = db.query(UserStoryDB).all()

        if not stories:
            console.print("\n[yellow]No user stories found in database[/yellow]")
            return

        table = Table(title="User Stories in Database")
        table.add_column("ID", style="cyan")
        table.add_column("Title", style="white")
        table.add_column("Priority", style="yellow")
        table.add_column("Status", style="green")
        table.add_column("Progress", style="blue")

        for story in stories:
            table.add_row(
                story.id,
                story.title[:50] + "..." if len(story.title) > 50 else story.title,
                story.priority.value if story.priority else "N/A",
                story.status.value if story.status else "N/A",
                f"{story.completion_percentage:.0f}%"
            )

        console.print("\n")
        console.print(table)
    finally:
        db.close()


@app.command()
def stats():
    """Show project statistics"""
    db = SessionLocal()
    try:
        total_stories = db.query(UserStoryDB).count()
        total_test_cases = db.query(TestCaseDB).count()

        console.print("\n[bold cyan]Project Statistics[/bold cyan]\n")
        console.print(f"[blue]Total User Stories:[/blue] {total_stories}")
        console.print(f"[blue]Total Test Cases:[/blue] {total_test_cases}")

        # Stories by status
        console.print("\n[bold]Stories by Status:[/bold]")
        for status in ["Backlog", "To Do", "In Progress", "Testing", "Done"]:
            count = db.query(UserStoryDB).filter(UserStoryDB.status == status).count()
            console.print(f"  [yellow]{status}:[/yellow] {count}")

    finally:
        db.close()


@app.command()
def generate_all(
    file_path: str = typer.Argument(..., help="Path to XLSX or CSV file"),
    project_name: str = typer.Argument(..., help="Project name"),
    use_ai: bool = typer.Option(True, help="Use AI for scenarios")
):
    """
    🚀 FLUJO COMPLETO: Parsea → Genera TODO

    Genera toda la documentación QA de una vez:
    - Parsea historias del archivo
    - Genera test cases con IA
    - Crea test plan (MD + PDF)
    - Crea plantilla de bugs
    """
    from src.cli_full_workflow import full_workflow

    full_workflow(
        excel_file=file_path,
        project_name=project_name,
        use_ai=use_ai
    )


@app.command()
def server(
    host: str = typer.Option("0.0.0.0", help="Host to bind to"),
    port: int = typer.Option(8000, help="Port to bind to"),
    reload: bool = typer.Option(False, help="Enable auto-reload")
):
    """Start the FastAPI server"""
    import uvicorn

    console.print(f"\n[green]Starting server on {host}:{port}[/green]\n")

    uvicorn.run(
        "src.main:app",
        host=host,
        port=port,
        reload=reload or settings.debug
    )


if __name__ == "__main__":
    app()
