# VoiceGuard — Workplan Hackathon 48h

> **Documento de referencia para agentes de Claude trabajando en el proyecto.**
> Siempre consultar este archivo antes de tomar decisiones de arquitectura o scope.

---

## 1. Resumen Ejecutivo

**Producto:** VoiceGuard — Web app que detecta voces clonadas por IA en tiempo real durante llamadas y audios, alertando al usuario y a sus contactos de confianza antes de que el daño ocurra.

**Track del hackathon:** def/acc (tecnología defensiva).

**Modelo de amenaza:** Estafas con voz clonada dirigidas a adultos mayores ("llama tu nieto" con voz sintetizada), un vector de ataque en crecimiento explosivo en LATAM.

**Mecanismo de defensa:**
1. Detección en tiempo real de voz sintética por análisis acústico
2. Verificación contra perfiles de voz enrollados (contactos conocidos)
3. Sistema de alertas a familiar/cuidador vía WhatsApp/SMS

---

## 2. Equipo y Constraints

| Aspecto | Detalle |
|---|---|
| Tamaño equipo | 2 personas |
| Duración | 48 horas |
| Persona A | Backend + ML (Python, FastAPI) |
| Persona B | Frontend + UX (Next.js, React) |
| Workflow Git | Ramas separadas (`backend`, `frontend`) merge a `main` |
| Asistencia | Ambos usan Claude para codear |
| Entrega | Deploy en Vercel (frontend) + Railway (backend) |

---

## 3. Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                  │
│  Next.js 14 + TypeScript + Tailwind + shadcn/ui     │
│  Generado inicialmente con v0.dev                   │
└─────────────────────────────────────────────────────┘
                        ↕  WebSocket + REST
┌─────────────────────────────────────────────────────┐
│  BACKEND (Railway, Docker)                          │
│  FastAPI + Python 3.12                              │
│  - librosa (features acústicas)                     │
│  - resemblyzer (speaker embeddings)                 │
│  - transformers (Deepfake-audio-detection HF model) │
│  - SQLModel (ORM) → Supabase Postgres en prod,      │
│    SQLite en local dev (fallback en db.py)          │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│  PERSISTENCIA                                       │
│  Supabase Postgres (managed)                        │
│  Driver: psycopg2-binary, sslmode=require           │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│  SERVICIOS EXTERNOS                                 │
│  - Zavu API → Alertas WhatsApp/SMS a familiar       │
│  - MiniMax API → Generar voces falsas para testing  │
└─────────────────────────────────────────────────────┘
```

---

## 4. Contratos de API (Definidos en Hora 0-2)

```python
# REST Endpoints

POST /api/analyze
    Body: multipart/form-data { audio: File }
    Response: {
        "is_synthetic": boolean,
        "confidence": 0.0-1.0,
        "risk_level": "low" | "medium" | "high",
        "speaker_match": boolean | null,
        "matched_contact": string | null,
        "analysis_id": string
    }

POST /api/enroll
    Body: multipart/form-data { audio: File, name: string }
    Response: { "contact_id": string, "embedding_quality": 0.0-1.0 }

GET /api/contacts
    Response: { "contacts": [{ "id", "name", "enrolled_at" }] }

GET /api/incidents
    Query: ?limit=20&risk=high
    Response: { "incidents": [...] }

POST /api/alert
    Body: { "incident_id": string, "contact_phone": string }
    Response: { "sent": boolean, "channel": "whatsapp" | "sms" }

# WebSocket

WS /ws/analyze
    Stream: bytes (audio chunks, 16kHz PCM)
    Messages: { "type": "score", "data": { ...analyze response... } }
```

---

## 5. Estructura del Repositorio

```
voiceguard/
├── README.md
├── workplan.md                    ← este archivo
├── .env.example
│
├── backend/                       ← rama: backend
│   ├── main.py                    ← FastAPI app
│   ├── requirements.txt
│   ├── routers/
│   │   ├── analyze.py
│   │   ├── enroll.py
│   │   ├── incidents.py
│   │   └── alerts.py
│   ├── services/
│   │   ├── detection.py           ← lógica de deepfake detection
│   │   ├── speaker_verify.py      ← resemblyzer + matching
│   │   ├── audio_processing.py    ← librosa + features
│   │   └── notifications.py       ← Zavu API
│   ├── models/                    ← SQLModel schemas
│   │   ├── contact.py
│   │   └── incident.py
│   ├── tests/
│   │   └── test_detection.py      ← validar con audios MiniMax
│   └── data/
│       └── voiceguard.db          ← SQLite (gitignored)
│
└── frontend/                      ← rama: frontend
    ├── app/
    │   ├── page.tsx               ← Dashboard principal
    │   ├── enroll/page.tsx        ← Enrollar contacto
    │   ├── incidents/page.tsx     ← Historial
    │   └── layout.tsx
    ├── components/
    │   ├── AudioRecorder.tsx
    │   ├── RiskIndicator.tsx
    │   ├── ContactCard.tsx
    │   └── ui/                    ← shadcn components
    ├── lib/
    │   ├── api.ts                 ← client del backend
    │   └── audio.ts               ← MediaRecorder helpers
    └── package.json
```

---

## 6. Workplan Hora por Hora

### FASE 0 — Setup + Contratos (Horas 0-2) — **Ambos juntos**

| Hora | Tarea |
|---|---|
| 0-1 | Crear repo GitHub, ramas, cuentas Railway/Vercel, .env.example |
| 1-2 | Definir contratos de API en este documento, estructura de carpetas |

**Salida de fase:** Repo configurado, contratos firmados, ambos pueden empezar a trabajar en paralelo.

---

### FASE 1 — Motor + UI Base (Horas 2-14) — **Paralelo**

#### Persona A — Backend

| Hora | Tarea |
|---|---|
| 2-5 | FastAPI scaffold, CORS, WS endpoint, REST endpoints con respuestas mockeadas |
| 5-10 | Pipeline de detección: librosa MFCC + spectral features + clasificador acústico |
| 10-14 | Speaker enrollment: resemblyzer + cosine similarity matching |

#### Persona B — Frontend

| Hora | Tarea |
|---|---|
| 2-4 | Setup Next.js + Tailwind + shadcn, generar layout con v0.dev |
| 4-8 | Componente `AudioRecorder` con MediaRecorder API, integración WS |
| 8-14 | UI de resultados: `RiskIndicator`, score visual, mensajes de alerta |

**Hito de validación H14:** Demo interna de 15 min, ambos sincronizan. Backend devuelve scores reales con `curl`, frontend muestra resultados (puede ser con datos mock todavía).

---

### FASE 2 — Features Avanzadas (Horas 14-26) — **Paralelo**

#### Persona A — Backend

| Hora | Tarea |
|---|---|
| 14-18 | Integración Zavu: POST /api/alert envía WhatsApp al familiar |
| 18-22 | Persistencia: SQLite + SQLModel, guardar incidentes con metadatos |
| 22-26 | Calibración del modelo con voces generadas en MiniMax (dataset propio) |

#### Persona B — Frontend

| Hora | Tarea |
|---|---|
| 14-18 | Página `/enroll`: flujo de registro de voz de contacto conocido |
| 18-22 | Página `/incidents`: historial con filtros, tarjetas detalladas |
| 22-26 | UX para adulto mayor: botones grandes, alto contraste, copy accesible |

**Hito de validación H26:** Flujo end-to-end funcional localmente. Persona B puede enrollar un contacto, grabar audio, ver score, recibir alerta en WhatsApp.

---

### FASE 3 — Integración + Deploy (Horas 26-36)

| Hora | Tarea | Responsable |
|---|---|---|
| 26-28 | Merge ramas a `main`, resolver conflictos | Ambos |
| 28-30 | Deploy backend a Railway, configurar env vars | Persona A |
| 28-30 | Deploy frontend a Vercel, configurar env vars | Persona B |
| 30-34 | Testing end-to-end en producción con audios reales y de MiniMax | Ambos |
| 34-36 | Fix bugs encontrados en producción | Ambos |

**Hito de validación H36:** App accesible en URL pública de Vercel, demo funciona end-to-end con voces clonadas reales.

---

### FASE 4 — Polish + Demo Prep (Horas 36-44)

#### Persona A — Backend

| Hora | Tarea |
|---|---|
| 36-40 | Optimización: latencia de respuesta, logging |
| 40-44 | Documentación de la API (auto-gen con FastAPI Swagger) |

#### Persona B — Frontend

| Hora | Tarea |
|---|---|
| 36-40 | Pulido visual final, landing page con pitch del producto |
| 40-44 | Grabar video backup de demo (por si algo falla en vivo) |

**Hito de validación H44:** Producto pulido, video backup grabado, README listo.

---

### FASE 5 — Buffer + Demo (Horas 44-48)

| Hora | Tarea |
|---|---|
| 44-46 | Bug fixes finales, ensayar pitch 3 veces |
| 46-48 | Buffer para imprevistos, presentación final |

---

## 7. Decision Log

| # | Decisión | Alternativas consideradas | Por qué se eligió |
|---|---|---|---|
| 1 | Web app, no móvil | App nativa, browser extension | Web es más rápida de demostrar en 48h y no requiere instalación |
| 2 | Stack Python + Next.js | Node fullstack, Python puro con Streamlit | Python es ideal para ML, Next.js permite usar v0 para UI rápida |
| 3 | CPU-only para ML | GPU en HuggingFace Inference API | Modelos acústicos son ligeros; evita rate limits y cold starts |
| 4 | Contract-first workflow | Backend-first, feature-slice | Permite paralelismo total con equipo de 2 |
| 5 | Railway sobre Vercel para backend | Vercel serverless, HuggingFace Spaces | Vercel no soporta WebSockets para audio en tiempo real ni ML pesado |
| 6 | SQLite sobre Postgres | Supabase, Postgres en Railway | Simple, sin setup, suficiente para hackathon |
| 7 | Zavu sobre Twilio | SMTP, Twilio, Make webhooks | Zavu está incluido en el hackathon, API más simple, soporta WhatsApp |
| 8 | MiniMax como dataset, no como detector | Datasets públicos (ASVspoof) | MiniMax genera voces clonadas frescas y específicas a nuestro caso |
| 9 | Sin autenticación de usuarios | Auth0, Clerk, NextAuth | YAGNI para hackathon, agrega complejidad sin valor para el demo |
| 10 | librosa + resemblyzer | Modelo end-to-end de HuggingFace | Más rápido, controlable, sin dependencias externas |

---

## 8. Plan de Contingencia

| Riesgo | Probabilidad | Plan B |
|---|---|---|
| Modelo de detección no funciona o es muy lento | Media | Fallback a heurísticas simples: pitch variance + spectral flatness + duración de pausas — funciona razonablemente para demo |
| WebSockets dan problemas en Railway | Baja-Media | Fallback a polling REST cada 2 segundos con chunks de audio |
| Zavu API falla o tiene límites | Media | Fallback a notificación por email vía SMTP (Gmail App Password) |
| Railway deploy falla en últimas horas | Baja | Fallback a HuggingFace Spaces con Docker (configurar en hora 28 como backup) |
| Merge conflicts complejos en hora 26 | Media | Sesión de pair programming de 1h, ambos en misma rama temporalmente |
| Browser no da permiso de micrófono en demo | Baja | Botón alternativo "Subir archivo de audio" como fallback siempre disponible |
| Modelo de MiniMax no genera voces convincentes | Baja | Usar audios públicos de YouTube de voces clonadas conocidas |
| Persona A o B se atasca >2h en un problema | Alta | Regla: si una tarea lleva >2h sin progreso, pedir ayuda al compañero o simplificar el scope |

---

## 9. Reglas para Agentes de Claude

Cuando un agente trabaje en este proyecto:

1. **Siempre consultar este `workplan.md` antes de tomar decisiones de arquitectura.**
2. **No agregar features fuera del scope definido en este documento.** YAGNI ruthlessly.
3. **Respetar la división de ramas:** trabajo de backend va en rama `backend`, trabajo de frontend va en rama `frontend`.
4. **Respetar los contratos de API definidos en sección 4.** Si necesitan cambiar, actualizar este documento primero.
5. **No introducir nuevas dependencias externas** sin actualizar la sección de stack y discutirlo con el usuario.
6. **Si un agente detecta que el plan no se está cumpliendo o el tiempo se está agotando**, debe sugerir activar el Plan de Contingencia (sección 8) antes que arriesgar el deploy final.
7. **Antes de mergear a `main`:** verificar que los tests pasan y que el contrato de API no cambió sin documentar.
8. **Commits descriptivos:** usar prefijos `[backend]` o `[frontend]` en commits para claridad.

---

## 10. Métricas de Éxito del Demo

Para que el demo sea convincente ante los jueces, debe poder mostrar:

- [ ] Grabar voz real → score de "low risk" verde
- [ ] Reproducir voz clonada (MiniMax) → score de "high risk" rojo
- [ ] Enrollar un contacto, luego simular voz clonada de ese contacto → "Identidad no verificada"
- [ ] Recibir notificación de WhatsApp en celular del jurado/familiar simulado
- [ ] Mostrar dashboard de incidentes históricos
- [ ] Tiempo de respuesta < 3 segundos para análisis completo

---

## 11. Pitch Elevator (para preparar)

> "En LATAM, miles de adultos mayores son estafados cada mes por delincuentes que clonan la voz de sus familiares con IA. **VoiceGuard** es la primera capa de defensa: detecta voces sintéticas en tiempo real durante una llamada, alerta al familiar al instante por WhatsApp, y mantiene al usuario en control de su decisión. No reemplaza el juicio humano — lo amplifica con información que el oído humano ya no puede distinguir."

---

**Versión:** 1.0
**Última actualización:** Hora 0 del hackathon
**Mantener este documento actualizado conforme avance el proyecto.**
