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

export interface Archivo {
  id: string;
  nombre: string;
  nombreOriginal: string;
  tipo: string;
  url: string;
  tamanio?: number;
  obraId?: string;
  tareaId?: string;
  createdAt: string;
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
}

export interface CreateTareaDto {
  titulo: string;
  descripcion?: string;
  prioridad?: PrioridadTarea;
  orden?: number;
  fechaLimite?: string;
  trabajadorId?: string;
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
