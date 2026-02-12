import { ApiProperty } from '@nestjs/swagger';

export class TrabajadorBajaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  cargo: string;

  @ApiProperty()
  tipoAusencia: string;

  @ApiProperty()
  fechaInicio: Date;

  @ApiProperty({ nullable: true })
  fechaFin: Date | null;

  @ApiProperty({ nullable: true })
  notas: string | null;
}

export class ObraSinPersonalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  estado: string;

  @ApiProperty({ nullable: true })
  fechaInicioPrev: Date | null;

  @ApiProperty({ nullable: true })
  fechaFinPrev: Date | null;
}

export class ObraListaCerrarDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  tareasCompletadas: number;

  @ApiProperty({ nullable: true })
  fechaFinPrev: Date | null;
}

export class AsignacionPendienteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  obraId: string;

  @ApiProperty()
  obraNombre: string;

  @ApiProperty()
  trabajadorId: string;

  @ApiProperty()
  trabajadorNombre: string;

  @ApiProperty()
  fechaInicio: Date;

  @ApiProperty({ nullable: true })
  fechaFin: Date | null;
}

export class TareaVencidaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty()
  obraId: string;

  @ApiProperty()
  obraNombre: string;

  @ApiProperty()
  fechaLimite: Date;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  prioridad: string;
}

export class ObraVencidaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  fechaFinPrev: Date;

  @ApiProperty()
  diasVencida: number;
}

export class ComentarioSinLeerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  texto: string;

  @ApiProperty()
  autorNombre: string;

  @ApiProperty()
  tareaId: string;

  @ApiProperty()
  tareaTitulo: string;

  @ApiProperty()
  obraId: string;

  @ApiProperty()
  obraNombre: string;

  @ApiProperty()
  createdAt: Date;
}

export class RevisionCountsDto {
  @ApiProperty()
  trabajadoresBaja: number;

  @ApiProperty()
  obrasSinPersonal: number;

  @ApiProperty()
  obrasListasCerrar: number;

  @ApiProperty()
  asignacionesPendientes: number;

  @ApiProperty()
  tareasVencidas: number;

  @ApiProperty()
  obrasVencidas: number;

  @ApiProperty()
  comentariosSinLeer: number;

  @ApiProperty()
  total: number;
}

export class RevisionResponseDto {
  @ApiProperty()
  counts: RevisionCountsDto;

  @ApiProperty({ type: [TrabajadorBajaDto] })
  trabajadoresBaja: TrabajadorBajaDto[];

  @ApiProperty({ type: [ObraSinPersonalDto] })
  obrasSinPersonal: ObraSinPersonalDto[];

  @ApiProperty({ type: [ObraListaCerrarDto] })
  obrasListasCerrar: ObraListaCerrarDto[];

  @ApiProperty({ type: [AsignacionPendienteDto] })
  asignacionesPendientes: AsignacionPendienteDto[];

  @ApiProperty({ type: [TareaVencidaDto] })
  tareasVencidas: TareaVencidaDto[];

  @ApiProperty({ type: [ObraVencidaDto] })
  obrasVencidas: ObraVencidaDto[];

  @ApiProperty({ type: [ComentarioSinLeerDto] })
  comentariosSinLeer: ComentarioSinLeerDto[];
}
