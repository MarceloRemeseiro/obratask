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
