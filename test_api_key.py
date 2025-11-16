#!/usr/bin/env python3
"""
Script para debuggear qué API key está cargando el servidor
"""
import os
from backend.config import settings

print("=" * 60)
print("DEBUG: API Key Configuration")
print("=" * 60)

# Check if .env file exists
env_file = ".env"
if os.path.exists(env_file):
    print(f"✅ .env file found at: {os.path.abspath(env_file)}")
else:
    print(f"❌ .env file NOT found at: {os.path.abspath(env_file)}")

# Show current working directory
print(f"\n📁 Current directory: {os.getcwd()}")

# Show API key (masked for security)
api_key = settings.gemini_api_key
if api_key:
    masked_key = api_key[:10] + "..." + api_key[-4:] if len(api_key) > 14 else "***"
    print(f"\n🔑 API Key loaded: {masked_key}")
    print(f"   Length: {len(api_key)} characters")
    print(f"   Starts with: {api_key[:5]}...")
else:
    print("\n❌ NO API KEY LOADED!")

# Check environment variable directly
env_key = os.getenv("GEMINI_API_KEY")
if env_key:
    masked_env = env_key[:10] + "..." + env_key[-4:] if len(env_key) > 14 else "***"
    print(f"\n🌍 Environment variable: {masked_env}")
else:
    print("\n⚠️  GEMINI_API_KEY environment variable NOT set")

print("\n" + "=" * 60)
print("INSTRUCTIONS:")
print("=" * 60)
print("1. Make sure you have a .env file in the project root")
print("2. Verify the .env contains: GEMINI_API_KEY=your_actual_key")
print("3. Restart the Python server after changing .env")
print("4. If key was leaked, create a NEW one at:")
print("   https://aistudio.google.com/app/apikey")
print("=" * 60)
