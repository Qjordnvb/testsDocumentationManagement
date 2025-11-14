# 🔐 Security Checklist - Antes de Subir al Repositorio

## ✅ Verificación Completada (2025-11-14)

### 1. **Archivos Sensibles Protegidos**
- ✅ `.env` está en `.gitignore`
- ✅ `data/*.db` (base de datos) está en `.gitignore`
- ✅ `output/` (archivos generados) está en `.gitignore`
- ✅ `venv/` (entorno virtual) está en `.gitignore`

### 2. **API Keys y Secretos**
- ✅ No hay API keys hardcodeadas en el código
- ✅ GEMINI_API_KEY está en `.env` (no en código)
- ✅ NOTION_API_KEY (obsoleto) solo en `.env`
- ✅ Variables de entorno gestionadas con `pydantic-settings`

### 3. **Datos Sensibles**
- ⚠️ `ejemplo_user_stories.xlsx` contiene datos del proyecto **Pilsen Fresh**
  - **Decisión:** Es data de ejemplo pública (marketing de cerveza)
  - **Acción:** Se puede subir al repo
  - **Alternativa:** Si prefieres, renombra a `ejemplo_plantilla.xlsx` y limpia los datos

### 4. **Base de Datos**
- ✅ `data/qa_automation.db` está excluida del repo
- ✅ Contiene 7 user stories de ejemplo (no sensibles)

### 5. **Archivos Generados**
- ✅ `output/*.feature` excluidos (se generan automáticamente)
- ✅ `output/*.pdf` excluidos
- ✅ `output/*.docx` excluidos

---

## 📋 Archivos en el Repositorio

### ✅ Archivos SEGUROS para subir:

```
├── .claude.md                   ✅ Contexto para Claude (sin secretos)
├── .gitignore                   ✅ Configuración de exclusiones
├── README.md                    ✅ Documentación pública
├── HANDOFF_DOCUMENT.md          ✅ Guía técnica (sin secretos)
├── PROYECTO_REDEFINICION.md     ✅ Arquitectura y plan
├── PROJECT_STRUCTURE.txt        ✅ Estructura del código
├── requirements.txt             ✅ Dependencias Python
├── ejemplo_user_stories.xlsx    ⚠️ Data de ejemplo (Pilsen Fresh - decisión del usuario)
│
├── src/                         ✅ Todo el código fuente
│   ├── config.py                ✅ (usa variables de entorno, no secretos)
│   ├── models/                  ✅
│   ├── parsers/                 ✅
│   ├── generators/              ✅
│   ├── integrations/            ✅
│   └── database/                ✅
```

### ❌ Archivos EXCLUIDOS (no se suben):

```
├── .env                         ❌ API keys y secretos
├── venv/                        ❌ Entorno virtual (se regenera)
├── data/qa_automation.db        ❌ Base de datos con data procesada
├── output/                      ❌ Archivos generados
├── __pycache__/                 ❌ Python cache
├── *.pyc                        ❌ Bytecode compilado
```

---

## 🚨 Verificación Pre-Commit

Antes de cada `git push`, ejecuta:

```bash
# Verificar que .env no esté staged
git status | grep -q ".env" && echo "⚠️ PELIGRO: .env está siendo commiteado" || echo "✅ .env seguro"

# Verificar que no haya API keys en staged files
git diff --cached | grep -i "AIzaSy" && echo "⚠️ API KEY DETECTADA" || echo "✅ No hay API keys"

# Ver qué archivos se van a subir
git status
```

---

## 🔧 Comandos Git Recomendados

### Inicializar repo (si no existe):
```bash
git init
git add .
git status  # Revisar qué se va a commitear
```

### Verificar archivos excluidos:
```bash
git status --ignored
```

### Verificar contenido antes de commit:
```bash
git diff --cached
```

---

## ⚠️ Acciones Recomendadas ANTES de Subir

### 1. **Limpiar archivos obsoletos de Notion**
```bash
# Ya eliminados los .md de Notion
# Ahora eliminar código Python de Notion
rm src/integrations/notion_client.py
rm src/integrations/mcp_notion_client.py
rm src/cli_notion_setup.py
rm src/notion_ai_orchestrator.py
rm src/gemini_mcp_orchestrator.py
```

### 2. **Actualizar requirements.txt**
```bash
# Eliminar notion-client
sed -i '/notion-client/d' requirements.txt
```

### 3. **Crear .env.example** (plantilla sin secretos)
```bash
cat > .env.example << 'EOF'
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Azure DevOps (opcional)
AZURE_DEVOPS_ORG_URL=
AZURE_DEVOPS_PAT=
AZURE_DEVOPS_PROJECT=

# App Configuration
DEBUG=True
DATABASE_URL=sqlite:///./data/qa_automation.db
OUTPUT_DIR=./output
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
ALLOWED_EXTENSIONS=xlsx,csv
EOF
```

### 4. **Verificar .gitignore completo**
```bash
cat .gitignore | grep -E "^\.env$|^output/|^data/.*\.db"
# Debe mostrar estas 3 líneas
```

---

## 🎯 Estado Final del Repositorio

**Seguro para subir:** ✅

**Archivos con posible data sensible:**
- ⚠️ `ejemplo_user_stories.xlsx` - Contiene user stories de "Pilsen Fresh" (proyecto de marketing de cerveza)
  - **Recomendación:** Decide si:
    - A) Lo subes como ejemplo real (es data de marketing pública)
    - B) Creas un `ejemplo_plantilla.xlsx` con datos ficticios genéricos
    - C) Lo excluyes del repo agregando `*.xlsx` al `.gitignore`

**API Keys protegidas:** ✅
- Todas en `.env`
- `.env` en `.gitignore`
- No hay hardcoding en código

**Base de datos protegida:** ✅
- Excluida del repo
- Se regenera con `python -m src.cli parse`

---

## 📝 Comandos Post-Subida

Cuando otro desarrollador clone el repo:

```bash
# 1. Clonar
git clone <repo-url>
cd testDocumentationAutomation

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Copiar .env.example y configurar
cp .env.example .env
# Editar .env con API keys reales

# 5. Crear directorios necesarios
mkdir -p data output uploads

# 6. Probar
python -m src.cli parse ejemplo_user_stories.xlsx
```

---

## ✅ Checklist Final

Antes de `git push`:

- [ ] `.env` está en `.gitignore` ✓
- [ ] No hay API keys en el código ✓
- [ ] Base de datos excluida ✓
- [ ] `output/` excluido ✓
- [ ] Archivos de Notion eliminados
- [ ] `requirements.txt` actualizado (sin notion-client)
- [ ] `.env.example` creado
- [ ] `git status` revisado
- [ ] `git diff --cached` revisado
- [ ] Documentación completa (README, HANDOFF, etc.) ✓

---

**Última Verificación:** 2025-11-14
**Estado:** ✅ SEGURO PARA SUBIR (después de limpiar archivos de Notion)
**Repositorio:** Listo para GitHub/GitLab público o privado
