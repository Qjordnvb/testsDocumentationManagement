"""
Flujo completo integrado - Genera toda la documentación de una vez
"""
import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from pathlib import Path

from backend.config import settings
from backend.parsers import FileParser
from backend.generators import GherkinGenerator, TestPlanGenerator, BugReportGenerator
from backend.integrations import GeminiClient
from backend.database import SessionLocal, UserStoryDB, TestCaseDB
from backend.models import UserStory, TestCase

console = Console()


def full_workflow(
    excel_file: str,
    project_name: str,
    use_ai: bool = True
):
    """
    Flujo completo: Parsea Excel → Genera toda la documentación QA

    Args:
        excel_file: Ruta al archivo Excel/CSV
        project_name: Nombre del proyecto
        use_ai: Si debe usar IA para generar escenarios
    """

    console.print("\n[bold cyan]🚀 Iniciando Flujo Completo de Documentación QA[/bold cyan]\n")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:

        # PASO 1: Parsear archivo
        task1 = progress.add_task("[cyan]Paso 1/4: Parseando archivo...", total=1)
        parser = FileParser()
        result = parser.parse(excel_file)

        if not result.success:
            console.print(f"\n[red]❌ Error al parsear: {result.errors}[/red]")
            return

        # Guardar en DB
        db = SessionLocal()
        for story in result.user_stories:
            db_story = UserStoryDB(
                id=story.id,
                title=story.title,
                description=story.description,
                priority=story.priority,
                status=story.status,
                story_points=story.story_points,
                total_criteria=len(story.acceptance_criteria)
            )
            db.merge(db_story)
        db.commit()

        progress.update(task1, completed=1)
        console.print(f"[green]✓ Parseadas {len(result.user_stories)} historias[/green]")

        # PASO 2: Generar test cases con IA
        task2 = progress.add_task(
            f"[cyan]Paso 2/4: Generando test cases con IA...",
            total=len(result.user_stories)
        )

        gemini = GeminiClient(api_key=settings.gemini_api_key) if use_ai else None
        gherkin_gen = GherkinGenerator(gemini)

        settings.ensure_directories()
        test_cases_created = []

        for i, user_story in enumerate(result.user_stories):
            gherkin_file = gherkin_gen.generate_from_user_story(
                user_story=user_story,
                output_dir=settings.output_dir,
                use_ai=use_ai,
                num_scenarios=3
            )

            # Guardar test case en DB
            test_case_id = f"TC-{user_story.id}-001"
            db_test_case = TestCaseDB(
                id=test_case_id,
                title=f"Test for {user_story.title}",
                description=f"Test scenarios for {user_story.id}",
                user_story_id=user_story.id,
                gherkin_file_path=gherkin_file
            )
            db.merge(db_test_case)
            test_cases_created.append(test_case_id)

            progress.update(task2, advance=1)

        db.commit()
        console.print(f"[green]✓ Generados {len(test_cases_created)} archivos .feature[/green]")

        # PASO 3: Generar Test Plan
        task3 = progress.add_task("[cyan]Paso 3/4: Generando Test Plan...", total=1)

        test_plan_gen = TestPlanGenerator()
        test_cases_db = db.query(TestCaseDB).all()

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

        files = test_plan_gen.generate_test_plan(
            user_stories=result.user_stories,
            test_cases=test_cases,
            output_dir=settings.output_dir,
            project_name=project_name,
            format="both"
        )

        progress.update(task3, completed=1)
        console.print(f"[green]✓ Test Plan creado: Markdown + PDF[/green]")

        # PASO 4: Crear plantilla de Bug Report
        task4 = progress.add_task("[cyan]Paso 4/4: Creando plantilla de Bug Report...", total=1)

        bug_gen = BugReportGenerator()
        template_path = bug_gen.generate_template(settings.output_dir)

        progress.update(task4, completed=1)
        console.print(f"[green]✓ Plantilla de Bug Report creada[/green]")

        # Resumen
        console.print("\n[bold green]✅ FLUJO COMPLETO TERMINADO[/bold green]\n")

        console.print("[bold]📊 Resumen:[/bold]")
        console.print(f"  • Historias parseadas: {len(result.user_stories)}")
        console.print(f"  • Test cases generados: {len(test_cases_created)}")
        console.print(f"  • Archivos .feature: {len(test_cases_created)}")
        console.print(f"  • Test Plan: ✓ (Markdown + PDF)")
        console.print(f"  • Bug Template: ✓ (Word)")

        console.print(f"\n[bold]📁 Archivos generados en:[/bold] {settings.output_dir}")

        console.print("\n[bold cyan]🎉 ¡Documentación QA completa generada![/bold cyan]\n")

        db.close()


if __name__ == "__main__":
    typer.run(full_workflow)
