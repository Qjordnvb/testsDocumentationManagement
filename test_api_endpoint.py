#!/usr/bin/env python3
"""
Test API Endpoint: Verificar qué retorna GET /user-stories
"""
import requests
import json

def test_api():
    print("=" * 70)
    print("🧪 TEST: API Endpoint GET /user-stories")
    print("=" * 70)
    print()

    # Test endpoint
    url = "http://localhost:8000/api/v1/user-stories"
    params = {"project_id": "PROJ-001"}

    print(f"📡 Request: GET {url}")
    print(f"   Params: {params}")
    print()

    try:
        response = requests.get(url, params=params, timeout=5)

        print(f"📊 Response Status: {response.status_code}")
        print()

        if response.status_code == 200:
            data = response.json()
            stories = data.get("user_stories", [])

            print(f"✅ Response exitoso: {len(stories)} user stories")
            print()

            # Ver primera story en detalle
            if stories:
                print("🔍 Primera User Story (JSON completo):")
                print("-" * 70)
                first_story = stories[0]
                print(json.dumps(first_story, indent=2, ensure_ascii=False))
                print("-" * 70)
                print()

                # Verificar acceptance_criteria específicamente
                print("✅ Verificación de acceptance_criteria:")
                print(f"   Campo existe: {'acceptance_criteria' in first_story}")
                print(f"   Tipo: {type(first_story.get('acceptance_criteria'))}")
                print(f"   Valor: {first_story.get('acceptance_criteria')}")
                print(f"   Length: {len(first_story.get('acceptance_criteria', []))}")
                print()

                # Ver todas las stories
                print("📋 Resumen de todas las stories:")
                for s in stories:
                    criteria = s.get('acceptance_criteria', [])
                    total = s.get('total_criteria', 0)
                    print(f"   {s.get('id')}: {len(criteria)} criterios (total_criteria={total})")

            else:
                print("⚠️  Response vacío - no hay user stories")

        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ ERROR: No se puede conectar al backend")
        print("   ¿Está corriendo el servidor?")
        print("   Ejecutar: cd backend && python main.py")
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api()
