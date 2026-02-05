import type {
  Trabajador,
  Obra,
  Tarea,
  Subtarea,
  ObraTrabajador,
  Archivo,
  TrabajadorAusencia,
  CreateTrabajadorDto,
  CreateObraDto,
  CreateTareaDto,
  UpdateTareaDto,
  CreateSubtareaDto,
  AsignarTrabajadorDto,
  CreateAusenciaDto,
  EstadoTarea,
  RevisionResponse,
  RevisionCounts,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Auth helpers
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('No autorizado');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Error en la petición');
  }

  // Handle empty responses (204 No Content or empty body)
  if (res.status === 204) {
    return undefined as T;
  }

  // Check if response has content before parsing
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error de autenticación');
    }
    const data = await res.json();
    setToken(data.access_token);
    return data;
  },
  logout: () => {
    removeToken();
  },
};

// Trabajadores
export const trabajadoresApi = {
  getAll: () => fetchApi<Trabajador[]>('/trabajadores'),
  getById: (id: string) => fetchApi<Trabajador>(`/trabajadores/${id}`),
  create: (data: CreateTrabajadorDto) =>
    fetchApi<Trabajador>('/trabajadores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateTrabajadorDto>) =>
    fetchApi<Trabajador>(`/trabajadores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<void>(`/trabajadores/${id}`, { method: 'DELETE' }),
  // Ausencias
  getAllAusencias: () => fetchApi<TrabajadorAusencia[]>('/trabajadores/ausencias'),
  getAusencias: (trabajadorId: string) =>
    fetchApi<TrabajadorAusencia[]>(`/trabajadores/${trabajadorId}/ausencias`),
  createAusencia: (trabajadorId: string, data: CreateAusenciaDto) =>
    fetchApi<TrabajadorAusencia & { asignacionesAfectadas?: { id: string; obraId: string; obraNombre: string; fechaInicio: string; fechaFin?: string }[] }>(`/trabajadores/${trabajadorId}/ausencias`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAusencia: (
    trabajadorId: string,
    ausenciaId: string,
    data: Partial<CreateAusenciaDto>
  ) =>
    fetchApi<TrabajadorAusencia>(
      `/trabajadores/${trabajadorId}/ausencias/${ausenciaId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),
  deleteAusencia: (trabajadorId: string, ausenciaId: string) =>
    fetchApi<void>(`/trabajadores/${trabajadorId}/ausencias/${ausenciaId}`, {
      method: 'DELETE',
    }),
};

// Obras
export const obrasApi = {
  getAll: () => fetchApi<Obra[]>('/obras'),
  getById: (id: string) => fetchApi<Obra>(`/obras/${id}`),
  create: (data: CreateObraDto) =>
    fetchApi<Obra>('/obras', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateObraDto>) =>
    fetchApi<Obra>(`/obras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => fetchApi<void>(`/obras/${id}`, { method: 'DELETE' }),
  cerrar: (id: string) =>
    fetchApi<Obra>(`/obras/${id}/cerrar`, { method: 'POST' }),
  getTrabajadores: (obraId: string) =>
    fetchApi<ObraTrabajador[]>(`/obras/${obraId}/trabajadores`),
  asignarTrabajador: (obraId: string, data: AsignarTrabajadorDto) =>
    fetchApi<ObraTrabajador>(`/obras/${obraId}/trabajadores`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  desasignarTrabajador: (obraId: string, asignacionId: string) =>
    fetchApi<void>(`/obras/${obraId}/trabajadores/${asignacionId}`, {
      method: 'DELETE',
    }),
};

// Tareas
export const tareasApi = {
  getByObra: (obraId: string) => fetchApi<Tarea[]>(`/obras/${obraId}/tareas`),
  getById: (obraId: string, tareaId: string) =>
    fetchApi<Tarea>(`/obras/${obraId}/tareas/${tareaId}`),
  create: (obraId: string, data: CreateTareaDto) =>
    fetchApi<Tarea>(`/obras/${obraId}/tareas`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (obraId: string, tareaId: string, data: UpdateTareaDto) =>
    fetchApi<Tarea>(`/obras/${obraId}/tareas/${tareaId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (obraId: string, tareaId: string) =>
    fetchApi<void>(`/obras/${obraId}/tareas/${tareaId}`, { method: 'DELETE' }),
  reordenar: (obraId: string, tareas: { id: string; orden: number }[]) =>
    fetchApi<Tarea[]>(`/obras/${obraId}/tareas/reordenar`, {
      method: 'PATCH',
      body: JSON.stringify({ tareas }),
    }),
};

// Subtareas
export const subtareasApi = {
  getByTarea: (tareaId: string) =>
    fetchApi<Subtarea[]>(`/tareas/${tareaId}/subtareas`),
  create: (tareaId: string, data: CreateSubtareaDto) =>
    fetchApi<Subtarea>(`/tareas/${tareaId}/subtareas`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    tareaId: string,
    subtareaId: string,
    data: Partial<CreateSubtareaDto> & { estado?: EstadoTarea }
  ) =>
    fetchApi<Subtarea>(`/tareas/${tareaId}/subtareas/${subtareaId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (tareaId: string, subtareaId: string) =>
    fetchApi<void>(`/tareas/${tareaId}/subtareas/${subtareaId}`, {
      method: 'DELETE',
    }),
};

// Archivos
export const archivosApi = {
  getAll: (filters?: { obraId?: string; tareaId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.obraId) params.append('obraId', filters.obraId);
    if (filters?.tareaId) params.append('tareaId', filters.tareaId);
    const query = params.toString();
    return fetchApi<Archivo[]>(`/archivos${query ? `?${query}` : ''}`);
  },
  upload: async (
    file: File,
    obraId?: string,
    tareaId?: string
  ): Promise<Archivo> => {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (obraId) params.append('obraId', obraId);
    if (tareaId) params.append('tareaId', tareaId);
    const query = params.toString();

    const token = getToken();
    const res = await fetch(`${API_URL}/archivos${query ? `?${query}` : ''}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (res.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('No autorizado');
    }

    if (!res.ok) {
      throw new Error('Error al subir archivo');
    }

    return res.json();
  },
  getSignedUrl: (id: string) => fetchApi<string>(`/archivos/${id}/url`),
  delete: (id: string) =>
    fetchApi<void>(`/archivos/${id}`, { method: 'DELETE' }),
};

// Revision
export const revisionApi = {
  getAll: () => fetchApi<RevisionResponse>('/revision'),
  getCounts: () => fetchApi<RevisionCounts>('/revision/counts'),
};
