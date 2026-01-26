# obraTask - Sistema de Gestion de Obras

Aplicacion para gestionar obras de construccion, tareas (estilo Kanban) y personal. El encargado de obra administra todo desde la app.

## Caracteristicas

- Dashboard con resumen de obras activas
- Gestion de obras con estados derivados automaticamente
- Tablero Kanban para tareas (drag & drop)
- Gestion de trabajadores y asignaciones
- Calendario con vista de obras y asignaciones
- Subida de archivos (MinIO)
- Diseno Mobile First (responsive)

## Stack Tecnologico

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: NestJS + TypeORM
- **Base de datos**: PostgreSQL
- **Almacenamiento**: MinIO (fotos y documentos)

## Estructura del Proyecto

```
obraTask/
├── frontend/                 # Next.js App
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Componentes React
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── obras/       # Componentes de obras
│   │   │   └── tareas/      # Componentes Kanban
│   │   ├── lib/             # Utilidades, API client
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   └── package.json
│
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── obras/           # Modulo de obras
│   │   ├── tareas/          # Modulo de tareas
│   │   ├── subtareas/       # Modulo de subtareas
│   │   ├── trabajadores/    # Modulo de trabajadores
│   │   ├── archivos/        # Modulo de archivos (MinIO)
│   │   └── database/        # Entidades TypeORM
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml        # Produccion
├── docker-compose.dev.yml    # Desarrollo
├── nginx.conf               # Configuracion Nginx
└── README.md
```

## Desarrollo Local

### Requisitos

- Node.js 20+
- Docker y Docker Compose

### Levantar servicios de desarrollo

```bash
# Clonar el proyecto
cd obraTask

# Levantar PostgreSQL y MinIO
docker-compose -f docker-compose.dev.yml up -d

# En una terminal - Backend
cd backend
npm install
npm run start:dev

# En otra terminal - Frontend
cd frontend
npm install
npm run dev
```

### URLs de desarrollo

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## API Endpoints

### Trabajadores
- `GET /api/trabajadores` - Listar todos
- `POST /api/trabajadores` - Crear trabajador
- `GET /api/trabajadores/:id` - Obtener por ID
- `PATCH /api/trabajadores/:id` - Actualizar
- `DELETE /api/trabajadores/:id` - Eliminar

### Obras
- `GET /api/obras` - Listar todas (con estado derivado)
- `POST /api/obras` - Crear obra
- `GET /api/obras/:id` - Obtener por ID
- `PATCH /api/obras/:id` - Actualizar
- `DELETE /api/obras/:id` - Eliminar
- `POST /api/obras/:id/cerrar` - Cerrar obra manualmente
- `GET /api/obras/:id/trabajadores` - Trabajadores asignados
- `POST /api/obras/:id/trabajadores` - Asignar trabajador
- `DELETE /api/obras/:id/trabajadores/:asignacionId` - Desasignar

### Tareas
- `GET /api/obras/:obraId/tareas` - Listar tareas de una obra
- `POST /api/obras/:obraId/tareas` - Crear tarea
- `PATCH /api/obras/:obraId/tareas/:id` - Actualizar (incluye cambio de estado)
- `DELETE /api/obras/:obraId/tareas/:id` - Eliminar
- `PATCH /api/obras/:obraId/tareas/reordenar` - Reordenar tareas

### Subtareas
- `GET /api/tareas/:tareaId/subtareas` - Listar subtareas
- `POST /api/tareas/:tareaId/subtareas` - Crear subtarea
- `PATCH /api/tareas/:tareaId/subtareas/:id` - Actualizar
- `DELETE /api/tareas/:tareaId/subtareas/:id` - Eliminar

### Archivos
- `GET /api/archivos` - Listar (filtrable por obraId, tareaId)
- `POST /api/archivos` - Subir archivo
- `GET /api/archivos/:id/url` - Obtener URL firmada
- `DELETE /api/archivos/:id` - Eliminar

## Estados de Obra

Los estados se calculan automaticamente basandose en las tareas:

- **SIN_INICIAR**: No hay tareas o todas estan pendientes
- **EN_PROGRESO**: Al menos una tarea en progreso o completada
- **LISTA_PARA_CERRAR**: Todas las tareas completadas
- **COMPLETADA**: Cerrada manualmente por el encargado

## Produccion

### Con Docker Compose

```bash
# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Construir y levantar
docker-compose up -d --build
```

La aplicacion estara disponible en http://localhost

### Deploy con Dockploy

1. Conectar repositorio de GitHub a Dockploy
2. Configurar variables de entorno:
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `MINIO_ROOT_USER`
   - `MINIO_ROOT_PASSWORD`
   - `API_URL` (URL publica del backend)
3. Deploy automatico con cada push a main

## Variables de Entorno

### Backend (.env)
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=obratask
DATABASE_PASSWORD=obratask123
DATABASE_NAME=obratask

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=obratask
MINIO_USE_SSL=false

PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Licencia

MIT
