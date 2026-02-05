# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

obraTask is a construction project management system (Spanish: "obras" = construction projects). It features a Kanban task board, worker management, file uploads, and a dashboard for supervisors to manage construction sites.

## Development Commands

### Start Development Environment
```bash
# Start PostgreSQL and MinIO (required first)
docker-compose -f docker-compose.dev.yml up -d

# Backend (terminal 1)
cd backend && npm run start:dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

### Backend Commands
```bash
cd backend
npm run start:dev      # Development with hot reload
npm run build          # Production build
npm run test           # Run unit tests
npm run test:watch     # Watch mode
npm run test:e2e       # End-to-end tests
npm run lint           # ESLint with auto-fix
npm run format         # Prettier formatting
```

### Frontend Commands
```bash
cd frontend
npm run dev    # Development server (port 3000)
npm run build  # Production build
npm run lint   # ESLint
```

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## Architecture

### Monorepo Structure
```
obraTask/
├── frontend/     # Next.js 16 App Router
├── backend/      # NestJS REST API
```

### Backend (NestJS + TypeORM + PostgreSQL)

**Module Organization** (`backend/src/`):
- `obras/` - Construction projects (CRUD + worker assignments)
- `tareas/` - Tasks within projects (Kanban board)
- `subtareas/` - Subtasks nested under tasks
- `trabajadores/` - Workers (with absences/ausencias)
- `archivos/` - File uploads to MinIO
- `revision/` - Dashboard for pending items
- `database/entities/` - TypeORM entities and enums

**Key Pattern - Derived State**: Obra (project) status is calculated dynamically based on task states, not stored. See `calcularEstadoDerivado()` in `obras/obras.service.ts:201`.

**Estado (Status) Flow**:
- `SIN_INICIAR` → No tasks or all PENDIENTE
- `EN_PROGRESO` → Any task EN_PROGRESO or COMPLETADO
- `LISTA_PARA_CERRAR` → All tasks COMPLETADO
- `COMPLETADA` → Manually closed via `cerradaManualmente` flag

### Frontend (Next.js 16 + Tailwind + shadcn/ui)

**App Router Pages** (`frontend/src/app/`):
- `/` - Dashboard
- `/obras/[id]` - Project detail with Kanban board
- `/trabajadores/` - Worker list
- `/calendario/` - Calendar view
- `/planificacion/` - Planning view
- `/revision/` - Pending items dashboard

**Component Organization** (`frontend/src/components/`):
- `ui/` - shadcn/ui components (new-york style)
- `layout/` - Header, Sidebar, BottomNav (mobile-first)
- `obras/` - Project-specific components
- `tareas/` - Kanban board components

**API Client**: All backend calls go through `frontend/src/lib/api.ts` which provides typed wrappers for each endpoint.

**Types**: Shared types are defined in `frontend/src/types/index.ts` (enums and interfaces mirror backend entities).

### Database Entities

Main entities in `backend/src/database/entities/`:
- `Obra` - Project with dates (prev/real), status derived from tasks
- `Tarea` - Task with estado, prioridad, orden for Kanban
- `Subtarea` - Child of Tarea
- `Trabajador` - Worker with contract info, specialties, license types
- `TrabajadorAusencia` - Worker absences (vacaciones, baja, etc.)
- `ObraTrabajador` - Many-to-many assignment with date range
- `Archivo` - Files stored in MinIO

### File Storage

Files are stored in MinIO (S3-compatible). The `archivos` module handles upload/download with presigned URLs.

## Language

The codebase and UI are in Spanish. Key terms:
- obra = construction project/site
- tarea = task
- subtarea = subtask
- trabajador = worker
- asignación = assignment
- ausencia = absence (vacaciones, baja, permiso)
- carnet = license
- cerrar = close/complete
