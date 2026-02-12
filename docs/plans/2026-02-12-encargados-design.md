# Encargados - Design Document

## Overview

System to assign workers the "Encargado" (foreman) role, giving them a dedicated admin section and a public mobile-first view where they can manage their assigned tasks across all their obras.

## Data Model

### Modified Entities

**Trabajador** - New fields:
- `esEncargado: boolean` (default: false)
- `publicToken: string | null` (UUID, auto-generated when esEncargado=true)
- `pin: string | null` (4-digit plain text, set by admin, required when esEncargado=true)

### New Entities

**TareaComentario:**
- `id` - UUID primary key
- `tareaId` - FK to Tarea (required)
- `texto` - string (required)
- `autor` - enum: ADMIN | ENCARGADO
- `autorNombre` - string (admin username or encargado name)
- `createdAt` - timestamp

Relations: Tarea has one-to-many TareaComentario.

### Notes
- No new junction tables. Tarea.trabajadorId (existing) is reused for encargado assignment.
- PIN stored in plain text. Real security comes from the UUID token; PIN is a casual-access barrier.
- When esEncargado toggled off: publicToken and pin are cleared.

## API Endpoints

### Admin (JWT required)

**Encargados:**
- `GET /api/encargados` - List encargados with task summary (pending/in-progress/completed per obra)
- `GET /api/encargados/:id` - Encargado detail with all tasks grouped by obra
- `POST /api/trabajadores/:id/regenerar-token` - Regenerate publicToken

**Comments:**
- `GET /api/tareas/:tareaId/comentarios` - List comments for a task
- `POST /api/tareas/:tareaId/comentarios` - Admin creates comment (autor: ADMIN)

### Public (no JWT, token + PIN validation)

All public endpoints validate: token exists in DB + X-Pin header matches.

- `POST /api/public/encargado/:token/verify` - Verify PIN, return encargado data + tasks. Body: `{ pin: "1234" }`
- `PATCH /api/public/encargado/:token/tareas/:tareaId` - Change task estado. Body: `{ estado: "EN_PROGRESO" }`
- `POST /api/public/encargado/:token/tareas/:tareaId/comentarios` - Add comment (autor: ENCARGADO)
- `POST /api/public/encargado/:token/tareas/:tareaId/fotos` - Upload photo
- `GET /api/public/encargado/:token/tareas/:tareaId/comentarios` - List comments

Validation: task must be assigned to the encargado (tarea.trabajadorId matches).

## Frontend - Admin

### Sidebar
New item "Encargados" (HardHat icon), between "Trabajadores" and "Ajustes". Route: `/encargados`.

### Page `/encargados` - List
Cards per encargado showing:
- Name, cargo
- Assigned obras (badges)
- Summary: "3 pendientes - 2 en progreso - 5 completadas"
- Last comment received (truncated preview + date)
- Click -> `/encargados/:id`

### Page `/encargados/:id` - Detail
- Header: name, phone, toggle, PIN field (editable), "Copy link" button
- Sections by obra with assigned tasks (simple list, not Kanban)
- Each task: title, estado badge, fecha limite, comment count
- Click task -> expand inline to show comments + reply input

### Worker Profile (`/trabajadores/:id`)
- New "Es encargado" toggle
- When active: PIN input (numeric, 4 digits, required) + copy link button

## Frontend - Public Mobile View

### Route: `/e/:token`

### PIN Screen
- Clean screen, obraTask logo, encargado name
- 4 large numeric inputs (verification code style)
- Auto-submit on 4th digit
- Error: shake animation + "PIN incorrecto"
- PIN saved in sessionStorage (persists across reloads within session)

### Main Screen (after PIN verified)
- Fixed header: encargado name + "Salir" button
- Obra filter: horizontal scroll chips (obra names + "Todas")
- Task list grouped by obra, each task as card:
  - Title, priority dot, fecha limite
  - Estado badge (tap to change via bottom sheet with 3 options)
  - Comment indicator (icon + count)
  - Photo indicator (icon + count)
- Fixed tab bar: "Tareas" | "Completadas"

### Task Detail (new page, not modal)
- Title, description, priority, fecha limite
- Large estado change button (prominent, easy to tap)
- Photo gallery (thumbnails, tap to enlarge)
- "Add photo" button (opens camera/gallery)
- Comment timeline (chat bubbles: admin left, encargado right)
- Fixed input at bottom for new comment (WhatsApp style)

### Mobile Design Rules
- Touch targets minimum 44px
- Large text, no hover effects
- Intuitive gestures

## Implementation Phases

### Phase 1 - Backend: Model & basic endpoints
- DB migration: esEncargado, publicToken, pin on Trabajador
- New TareaComentario entity + migration
- Modify TrabajadoresService for token/pin management
- POST /regenerar-token endpoint
- GET /api/encargados with aggregated task summary
- GET /api/encargados/:id with tasks by obra
- Comments CRUD (admin)

### Phase 2 - Backend: Public endpoints
- PublicEncargadoGuard (validates token + X-Pin)
- POST /api/public/encargado/:token/verify
- PATCH .../tareas/:tareaId (estado change)
- POST .../comentarios and POST .../fotos (public)
- Validation: task belongs to encargado

### Phase 3 - Frontend Admin: Encargados
- New page /encargados (list with summary)
- New page /encargados/:id (detail with tasks by obra + comments)
- Toggle + PIN on worker profile /trabajadores/:id
- Sidebar: new "Encargados" item
- Inline comments on tasks (admin replies)

### Phase 4 - Frontend: Public mobile view
- Public layout without sidebar/nav (route /e/:token)
- PIN screen (4 digits)
- Task list with obra filter
- Task detail: estado change, photos, chat-style comments
- Comment input + camera button
