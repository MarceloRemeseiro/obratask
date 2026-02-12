export enum EstadoObra {
  SIN_INICIAR = 'SIN_INICIAR',
  EN_PROGRESO = 'EN_PROGRESO',
  LISTA_PARA_CERRAR = 'LISTA_PARA_CERRAR',
  COMPLETADA = 'COMPLETADA',
}

export enum EstadoTarea {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADO = 'COMPLETADO',
}

export enum PrioridadTarea {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export enum TipoContrato {
  INDEFINIDO = 'INDEFINIDO',
  TEMPORAL = 'TEMPORAL',
  AUTONOMO = 'AUTONOMO',
  PRACTICAS = 'PRACTICAS',
}

export enum TipoAusencia {
  VACACIONES = 'VACACIONES',
  BAJA_ENFERMEDAD = 'BAJA_ENFERMEDAD',
  BAJA_ACCIDENTE = 'BAJA_ACCIDENTE',
  PERMISO = 'PERMISO',
  OTRO = 'OTRO',
}

export enum AutorComentario {
  ADMIN = 'ADMIN',
  ENCARGADO = 'ENCARGADO',
}

export enum TipoCarnet {
  AM = 'AM',
  A1 = 'A1',
  A2 = 'A2',
  A = 'A',
  B = 'B',
  C1 = 'C1',
  C = 'C',
  D1 = 'D1',
  D = 'D',
  BE = 'BE',
  C1E = 'C1E',
  CE = 'CE',
  D1E = 'D1E',
  DE = 'DE',
}

export interface Trabajador {
  id: string;
  nombre: string;
  cargo?: string;
  descripcion?: string;
  telefono?: string;
  email?: string;
  // Contrato
  tipoContrato?: TipoContrato;
  fechaInicioContrato?: string;
  fechaFinContrato?: string;
  // Vacaciones
  diasVacacionesAnuales: number;
  // Especialidades
  especialidades?: string[];
  // Carnet
  carnetConducir?: TipoCarnet;
  carnetConducirVencimiento?: string;
  // Documentación
  reconocimientoMedicoVencimiento?: string;
  formacionPRLVencimiento?: string;
  // Encargado
  esEncargado?: boolean;
  publicToken?: string;
  pin?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  // Relations
  obrasTrabajador?: ObraTrabajador[];
  ausencias?: TrabajadorAusencia[];
}

export interface TrabajadorAusencia {
  id: string;
  tipo: TipoAusencia;
  fechaInicio: string;
  fechaFin?: string;
  notas?: string;
  trabajadorId: string;
  trabajador?: Trabajador;
  createdAt: string;
  updatedAt: string;
}

export interface Obra {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaInicioPrev?: string;
  fechaFinPrev?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  estado: EstadoObra;
  cerradaManualmente: boolean;
  createdAt: string;
  updatedAt: string;
  tareas?: Tarea[];
  obrasTrabajador?: ObraTrabajador[];
  archivos?: Archivo[];
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  orden: number;
  fechaLimite?: string;
  obraId: string;
  trabajadorId?: string;
  trabajador?: Trabajador;
  createdAt: string;
  updatedAt: string;
  subtareas?: Subtarea[];
  archivos?: Archivo[];
  comentarios?: TareaComentario[];
}

export interface TareaComentario {
  id: string;
  texto: string;
  autor: AutorComentario;
  autorNombre: string;
  tareaId: string;
  leidoPorAdmin: boolean;
  leidoPorEncargado: boolean;
  createdAt: string;
}

export interface Subtarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  tareaId: string;
  trabajadorId?: string;
  trabajador?: Trabajador;
  createdAt: string;
  updatedAt: string;
}

export interface ObraTrabajador {
  id: string;
  obraId: string;
  trabajadorId: string;
  fechaInicio: string;
  fechaFin?: string;
  notas?: string;
  pendienteConfirmacion?: boolean;
  createdAt: string;
  obra?: Obra;
  trabajador?: Trabajador;
}

export enum TipoArchivo {
  DOCUMENTO = 'DOCUMENTO',
  FOTO = 'FOTO',
}

export interface Archivo {
  id: string;
  nombre: string;
  nombreOriginal: string;
  titulo?: string;
  descripcion?: string;
  tipo: string;
  tipoArchivo: TipoArchivo;
  url: string;
  tamanio?: number;
  obraId?: string;
  tareaId?: string;
  createdAt: string;
}

export interface UpdateArchivoDto {
  titulo?: string;
  descripcion?: string;
}

// DTOs
export interface CreateTrabajadorDto {
  nombre: string;
  cargo?: string;
  descripcion?: string;
  telefono?: string;
  email?: string;
  tipoContrato?: TipoContrato;
  fechaInicioContrato?: string;
  fechaFinContrato?: string;
  diasVacacionesAnuales?: number;
  especialidades?: string[];
  carnetConducir?: TipoCarnet;
  carnetConducirVencimiento?: string;
  reconocimientoMedicoVencimiento?: string;
  formacionPRLVencimiento?: string;
  esEncargado?: boolean;
  pin?: string;
}

export interface CreateAusenciaDto {
  tipo: TipoAusencia;
  fechaInicio: string;
  fechaFin?: string;
  notas?: string;
}

export interface CreateObraDto {
  nombre: string;
  descripcion?: string;
  fechaInicioPrev?: string;
  fechaFinPrev?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
}

export interface CreateTareaDto {
  titulo: string;
  descripcion?: string;
  prioridad?: PrioridadTarea;
  orden?: number;
  fechaLimite?: string;
  trabajadorId?: string | null;
}

export interface UpdateTareaDto extends Partial<CreateTareaDto> {
  estado?: EstadoTarea;
  trabajadorId?: string | null;
}

export interface CreateSubtareaDto {
  titulo: string;
  descripcion?: string;
  trabajadorId?: string;
}

export interface AsignarTrabajadorDto {
  trabajadorId: string;
  fechaInicio: string;
  fechaFin?: string;
  notas?: string;
}

export interface UpdateAsignacionDto {
  fechaInicio?: string;
  fechaFin?: string;
  notas?: string;
}

// Revision types
export interface TrabajadorBaja {
  id: string;
  nombre: string;
  cargo: string;
  tipoAusencia: string;
  fechaInicio: string;
  fechaFin: string | null;
  notas: string | null;
}

export interface ObraSinPersonal {
  id: string;
  nombre: string;
  estado: string;
  fechaInicioPrev: string | null;
  fechaFinPrev: string | null;
}

export interface ObraListaCerrar {
  id: string;
  nombre: string;
  tareasCompletadas: number;
  fechaFinPrev: string | null;
}

export interface AsignacionPendiente {
  id: string;
  obraId: string;
  obraNombre: string;
  trabajadorId: string;
  trabajadorNombre: string;
  fechaInicio: string;
  fechaFin: string | null;
}

export interface TareaVencida {
  id: string;
  titulo: string;
  obraId: string;
  obraNombre: string;
  fechaLimite: string;
  estado: string;
  prioridad: string;
}

export interface ObraVencida {
  id: string;
  nombre: string;
  estado: string;
  fechaFinPrev: string;
  diasVencida: number;
}

export interface ComentarioSinLeer {
  id: string;
  texto: string;
  autorNombre: string;
  tareaId: string;
  tareaTitulo: string;
  obraId: string;
  obraNombre: string;
  createdAt: string;
}

export interface RevisionCounts {
  trabajadoresBaja: number;
  obrasSinPersonal: number;
  obrasListasCerrar: number;
  asignacionesPendientes: number;
  tareasVencidas: number;
  obrasVencidas: number;
  comentariosSinLeer: number;
  total: number;
}

export interface RevisionResponse {
  counts: RevisionCounts;
  trabajadoresBaja: TrabajadorBaja[];
  obrasSinPersonal: ObraSinPersonal[];
  obrasListasCerrar: ObraListaCerrar[];
  asignacionesPendientes: AsignacionPendiente[];
  tareasVencidas: TareaVencida[];
  obrasVencidas: ObraVencida[];
  comentariosSinLeer: ComentarioSinLeer[];
}

// Encargados types
export interface EncargadoResumen {
  id: string;
  nombre: string;
  cargo?: string;
  telefono?: string;
  publicToken: string | null;
  pin: string | null;
  tareas: {
    pendientes: number;
    enProgreso: number;
    completadas: number;
    total: number;
  };
}

export interface EncargadoDetalle {
  id: string;
  nombre: string;
  cargo?: string;
  telefono?: string;
  publicToken: string | null;
  pin: string | null;
  tareasPorObra: {
    obra: { id: string; nombre: string };
    tareas: Tarea[];
  }[];
}

export interface VerifyResponse {
  encargado: {
    id: string;
    nombre: string;
    cargo?: string;
  };
  misTareas: (Tarea & { unreadCount?: number })[];
  tareasEquipo: (Tarea & { unreadCount?: number })[];
}

export interface CreateComentarioDto {
  texto: string;
}

export interface VerifyPinDto {
  pin: string;
}

export interface UpdateTareaEstadoDto {
  estado: EstadoTarea;
}
