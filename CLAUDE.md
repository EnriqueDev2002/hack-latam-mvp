# CLAUDE.md — Instrucciones para Agentes de Claude

> **Read this first, every time.** Este documento gobierna cómo cualquier agente de Claude debe operar en este repo.

---

## 0. Fuente de Verdad

**[workplan.md](workplan.md) es la fuente de verdad del proyecto.** Antes de cualquier decisión de arquitectura, scope, dependencias o flujo de trabajo, **consulta workplan.md**. Si lo que pides hacer no está en el workplan, pregunta antes de implementar.

Si necesitas cambiar algo del workplan (contratos de API, stack, scope), **actualiza workplan.md primero** y luego implementa.

---

## 1. Contexto del Proyecto

- **Producto:** VoiceGuard — detección de voces clonadas por IA con alertas defensivas
- **Track:** def/acc (tecnología defensiva, Hackathon LATAM 2026)
- **Duración:** 48 horas — cada hora cuenta, YAGNI ruthlessly
- **Equipo:** 2 personas (backend + frontend) trabajando en ramas separadas
- **Stack:** Next.js (Vercel) + FastAPI (Railway) + Zavu + MiniMax (testing)

---

## 2. Disciplina de Ramas

```
main        → integración, deploy final
backend     → trabajo de Persona A (FastAPI, ML, servicios)
frontend    → trabajo de Persona B (Next.js, UI, UX)
```

**Reglas:**
- **NUNCA mergear a `main` sin avisar al compañero.** Merge sincronizado en Fase 3 (hora 26).
- **NUNCA tocar archivos fuera de tu dominio** sin coordinar:
  - Backend: trabaja en `backend/`
  - Frontend: trabaja en `frontend/`
  - `workplan.md`, `CLAUDE.md`, `.env.example`, `README.md` → cambios deben anunciarse
- Si necesitas que el otro cambie algo, escríbelo en la sección "Cross-team requests" abajo.

---

## 3. Convenciones de Commit

Formato obligatorio:
```
[backend] feat: agregar endpoint /api/analyze
[backend] fix: corregir latencia en pipeline de audio
[frontend] feat: agregar AudioRecorder component
[frontend] style: ajustar contraste para accesibilidad
[docs] actualizar workplan con cambio en contratos
```

- Prefijo `[backend]` / `[frontend]` / `[docs]` siempre
- Mensaje en español o inglés (consistente con el del equipo)
- Commits pequeños y frecuentes — facilita el merge

---

## 4. Contratos de API — INMUTABLES sin coordinación

Los contratos viven en [workplan.md sección 4](workplan.md). Estos contratos son **acuerdos entre frontend y backend**. Si los cambias:

1. Actualiza `workplan.md` con el nuevo contrato
2. Avisa al otro miembro del equipo
3. Recién entonces implementa el cambio

**No cambies silenciosamente** un endpoint, un nombre de campo, o un tipo de respuesta. Romperás el trabajo del compañero.

---

## 5. Stack — No Agregar Dependencias Sin Permiso

Dependencias permitidas (ya definidas en workplan):

**Backend:**
- `fastapi`, `uvicorn`, `pydantic`, `sqlmodel`, `python-multipart`
- `librosa`, `numpy`, `scipy` (audio)
- `resemblyzer` (speaker embeddings)
- `httpx` (llamadas a Zavu, MiniMax)
- `python-dotenv`

**Frontend:**
- `next`, `react`, `typescript`, `tailwindcss`
- `shadcn/ui` components (instalados por demanda)
- `lucide-react` (iconos)
- `recharts` (si visualización es necesaria)

**Antes de instalar otra dependencia:** preguntar. Si justifica, actualizar workplan.

---

## 6. Variables de Entorno

Nunca commitear secrets. Cualquier valor sensible va en `.env` (gitignored) y se documenta en `.env.example` con valor vacío o de ejemplo.

**Backend `.env`:**
```
ZAVU_API_KEY=
MINIMAX_API_KEY=
DATABASE_URL=sqlite:///./data/voiceguard.db
CORS_ORIGINS=http://localhost:3000,https://*.vercel.app
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/analyze
```

---

## 7. Comandos Comunes

**Plataforma:** Windows (PowerShell). Si el comando no funciona en PS, usar Git Bash o WSL.

### Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev   # http://localhost:3000
```

### Git
```powershell
git checkout backend    # o frontend
git pull origin main    # antes de empezar el día
git push origin <rama>  # commits frecuentes
```

---

## 8. Reglas de Tiempo (Hackathon Mode)

1. **Si una tarea lleva más de 2 horas sin progreso visible → simplifica el scope o pide ayuda al compañero.** No te atasques.
2. **Hora 26 = punto de no retorno para features nuevas.** Después de eso, solo integración, deploy y polish.
3. **Activar Plan de Contingencia ([workplan §8](workplan.md)) ante cualquier riesgo de no entregar.** Mejor un demo simple que funciona que uno complejo que falla.
4. **Cada hora de polish vale más que una hora de feature extra** después de la hora 36.

---

## 9. Lo Que NO Debes Hacer

- ❌ Agregar autenticación de usuarios (fuera de scope)
- ❌ Agregar features no listadas en workplan
- ❌ Mergear a `main` sin coordinación
- ❌ Cambiar contratos de API sin actualizar workplan
- ❌ Instalar dependencias nuevas sin preguntar
- ❌ Commitear `.env`, archivos `.db`, `node_modules/`, `venv/`
- ❌ Refactorizar código del compañero sin avisar
- ❌ Hacer `git push --force` a main
- ❌ Crear documentos `.md` nuevos a menos que el usuario los pida

---

## 10. Lo Que SÍ Debes Hacer

- ✅ Leer workplan.md antes de empezar
- ✅ Commits pequeños y frecuentes con prefijo `[backend]` o `[frontend]`
- ✅ Preguntar si hay ambigüedad antes de implementar
- ✅ Mantener `.env.example` actualizado
- ✅ Probar localmente antes de pushear
- ✅ Actualizar workplan.md si una decisión cambia
- ✅ Avisar al compañero de cambios cross-cutting
- ✅ Priorizar el demo funcional sobre el código perfecto

---

## 11. Estilo de Código

**Backend (Python):**
- Type hints siempre que sea simple agregarlos
- Pydantic models para todos los request/response
- Sin docstrings largos — código claro, nombres explícitos
- Sin comentarios obvios

**Frontend (TypeScript/React):**
- Componentes funcionales con hooks
- Tipos explícitos en props y respuestas de API
- `shadcn/ui` para componentes base — no reinventar botones, modals
- Tailwind para todo el styling — no CSS modules ni styled-components

**Ambos:**
- Sin código muerto
- Sin manejo de errores especulativo (solo en boundaries reales)
- Sin abstracciones prematuras

---

## 12. Testing

- **Backend:** un par de tests críticos en `backend/tests/` para validar el detector con audios de MiniMax. No buscar cobertura, sí buscar que el modelo distinga real de sintético.
- **Frontend:** sin tests automatizados. Probar manualmente en navegador.
- **Integración:** validación manual durante hito de hora 26.

---

## 13. Cross-Team Requests

> Sección viva. Si necesitas algo del otro lado del stack, escríbelo aquí en lugar de tocar archivos del compañero.

```
[ ] (vacío por ahora)
```

---

## 14. Cuándo Preguntar al Usuario

Pregunta antes de actuar cuando:
- El cambio afecta a ambas ramas o a `main`
- Se trata de instalar/quitar dependencias
- El requerimiento no está claro en workplan.md
- Hay que tomar una decisión de UX que afecta el pitch
- Algo del Plan de Contingencia se vuelve probable

No preguntes para:
- Decisiones puramente de implementación dentro de tu dominio
- Renombrar variables locales
- Estilizado visual menor

---

## 15. Métricas de Éxito del Demo

Ver [workplan.md §10](workplan.md). Cualquier decisión técnica que ponga en riesgo estas métricas debe ser cuestionada inmediatamente.

---

**Versión:** 1.0
**Si encuentras un caso no cubierto aquí, agrégalo y avisa al equipo.**
