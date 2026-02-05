import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, And } from 'typeorm';
import { Obra, EstadoObra } from '../database/entities/obra.entity';
import { Tarea, EstadoTarea } from '../database/entities/tarea.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';
import { TipoAusencia } from '../database/entities/enums';
import { CreateObraDto } from './dto/create-obra.dto';
import { UpdateObraDto } from './dto/update-obra.dto';
import { AsignarTrabajadorDto } from './dto/asignar-trabajador.dto';
import { UpdateAsignacionDto } from './dto/update-asignacion.dto';

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
    @InjectRepository(Tarea)
    private tareaRepository: Repository<Tarea>,
    @InjectRepository(ObraTrabajador)
    private obraTrabajadorRepository: Repository<ObraTrabajador>,
    @InjectRepository(TrabajadorAusencia)
    private ausenciaRepository: Repository<TrabajadorAusencia>,
  ) {}

  async create(createObraDto: CreateObraDto): Promise<Obra> {
    const obra = this.obraRepository.create(createObraDto);
    return this.obraRepository.save(obra);
  }

  async findAll(): Promise<Obra[]> {
    const obras = await this.obraRepository.find({
      relations: ['tareas', 'obrasTrabajador', 'obrasTrabajador.trabajador'],
      order: { createdAt: 'DESC' },
    });
    return obras.map((obra) => this.calcularEstadoDerivado(obra));
  }

  async findOne(id: string): Promise<Obra> {
    const obra = await this.obraRepository.findOne({
      where: { id },
      relations: [
        'tareas',
        'tareas.subtareas',
        'tareas.trabajador',
        'obrasTrabajador',
        'obrasTrabajador.trabajador',
        'archivos',
      ],
    });
    if (!obra) {
      throw new NotFoundException(`Obra con ID ${id} no encontrada`);
    }
    return this.calcularEstadoDerivado(obra);
  }

  async update(id: string, updateObraDto: UpdateObraDto): Promise<Obra> {
    const obra = await this.findOne(id);
    Object.assign(obra, updateObraDto);
    return this.obraRepository.save(obra);
  }

  async remove(id: string): Promise<void> {
    const obra = await this.findOne(id);
    await this.obraRepository.remove(obra);
  }

  async cerrarObra(id: string): Promise<Obra> {
    const obra = await this.findOne(id);
    if (obra.estado !== EstadoObra.LISTA_PARA_CERRAR) {
      throw new Error(
        'Solo se pueden cerrar obras que estén listas para cerrar',
      );
    }
    obra.cerradaManualmente = true;
    obra.estado = EstadoObra.COMPLETADA;
    obra.fechaFinReal = new Date();
    return this.obraRepository.save(obra);
  }

  async asignarTrabajador(
    obraId: string,
    asignarTrabajadorDto: AsignarTrabajadorDto,
  ): Promise<ObraTrabajador & { warning?: string }> {
    const obra = await this.findOne(obraId);

    // Check for conflicting ausencias
    const { trabajadorId, fechaInicio, fechaFin } = asignarTrabajadorDto;
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = fechaFin ? new Date(fechaFin) : fechaInicioDate;

    const conflictosAusencia = await this.checkAusenciasConflicto(
      trabajadorId,
      fechaInicioDate,
      fechaFinDate,
    );

    // If there are vacaciones/permisos, don't allow
    const ausenciasBloquean = conflictosAusencia.filter(
      (a) => a.tipo === TipoAusencia.VACACIONES ||
             a.tipo === TipoAusencia.PERMISO ||
             a.tipo === TipoAusencia.OTRO
    );

    if (ausenciasBloquean.length > 0) {
      const tipos = ausenciasBloquean.map(a =>
        a.tipo === TipoAusencia.VACACIONES ? 'vacaciones' : 'permiso'
      ).join(', ');
      throw new BadRequestException(
        `El trabajador tiene ${tipos} programadas en esas fechas y no puede ser asignado`
      );
    }

    // If there are bajas, allow but mark as pending confirmation
    const tieneBaja = conflictosAusencia.some(
      (a) => a.tipo === TipoAusencia.BAJA_ENFERMEDAD || a.tipo === TipoAusencia.BAJA_ACCIDENTE
    );

    // Check for overlapping assignments in OTHER obras
    const conflictosObra = await this.checkAsignacionesConflicto(
      trabajadorId,
      obraId,
      fechaInicioDate,
      fechaFinDate,
    );

    const asignacion = this.obraTrabajadorRepository.create({
      obraId,
      ...asignarTrabajadorDto,
      pendienteConfirmacion: tieneBaja,
    });
    const savedAsignacion = await this.obraTrabajadorRepository.save(asignacion);

    // Build warning if there are overlapping assignments
    if (conflictosObra.length > 0) {
      const obrasConflicto = conflictosObra.map(c => c.obra?.nombre || 'Otra obra').join(', ');
      return {
        ...savedAsignacion,
        warning: `El trabajador también está asignado en: ${obrasConflicto} para las mismas fechas`,
      };
    }

    return savedAsignacion;
  }

  private async checkAsignacionesConflicto(
    trabajadorId: string,
    obraIdExcluir: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ObraTrabajador[]> {
    // Find other obra assignments that overlap with the given date range
    const asignaciones = await this.obraTrabajadorRepository
      .createQueryBuilder('asignacion')
      .leftJoinAndSelect('asignacion.obra', 'obra')
      .where('asignacion.trabajadorId = :trabajadorId', { trabajadorId })
      .andWhere('asignacion.obraId != :obraIdExcluir', { obraIdExcluir })
      .andWhere('asignacion.fechaInicio <= :fechaFin', { fechaFin })
      .andWhere('(asignacion.fechaFin >= :fechaInicio OR asignacion.fechaFin IS NULL)', { fechaInicio })
      .getMany();

    return asignaciones;
  }

  private async checkAusenciasConflicto(
    trabajadorId: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<TrabajadorAusencia[]> {
    // Find ausencias that overlap with the given date range
    // An ausencia overlaps if:
    // - ausencia.fechaInicio <= fechaFin AND (ausencia.fechaFin >= fechaInicio OR ausencia.fechaFin IS NULL)
    const ausencias = await this.ausenciaRepository
      .createQueryBuilder('ausencia')
      .where('ausencia.trabajadorId = :trabajadorId', { trabajadorId })
      .andWhere('ausencia.fechaInicio <= :fechaFin', { fechaFin })
      .andWhere('(ausencia.fechaFin >= :fechaInicio OR ausencia.fechaFin IS NULL)', { fechaInicio })
      .getMany();

    return ausencias;
  }

  async desasignarTrabajador(obraId: string, asignacionId: string): Promise<void> {
    const asignacion = await this.obraTrabajadorRepository.findOne({
      where: { id: asignacionId, obraId },
    });
    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }
    await this.obraTrabajadorRepository.remove(asignacion);
  }

  async updateAsignacion(
    obraId: string,
    asignacionId: string,
    updateAsignacionDto: UpdateAsignacionDto,
  ): Promise<ObraTrabajador> {
    const asignacion = await this.obraTrabajadorRepository.findOne({
      where: { id: asignacionId, obraId },
      relations: ['trabajador'],
    });
    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }
    Object.assign(asignacion, updateAsignacionDto);
    return this.obraTrabajadorRepository.save(asignacion);
  }

  async getTrabajadores(obraId: string): Promise<ObraTrabajador[]> {
    return this.obraTrabajadorRepository.find({
      where: { obraId },
      relations: ['trabajador'],
      order: { fechaInicio: 'ASC' },
    });
  }

  private calcularEstadoDerivado(obra: Obra): Obra {
    if (obra.cerradaManualmente) {
      obra.estado = EstadoObra.COMPLETADA;
      return obra;
    }

    const tareas = obra.tareas || [];
    if (tareas.length === 0) {
      obra.estado = EstadoObra.SIN_INICIAR;
      return obra;
    }

    const todasPendientes = tareas.every(
      (t) => t.estado === EstadoTarea.PENDIENTE,
    );
    const todasCompletadas = tareas.every(
      (t) => t.estado === EstadoTarea.COMPLETADO,
    );
    const algunaEnProgreso = tareas.some(
      (t) => t.estado === EstadoTarea.EN_PROGRESO,
    );

    if (todasCompletadas) {
      obra.estado = EstadoObra.LISTA_PARA_CERRAR;
    } else if (algunaEnProgreso || !todasPendientes) {
      obra.estado = EstadoObra.EN_PROGRESO;
    } else {
      obra.estado = EstadoObra.SIN_INICIAR;
    }

    return obra;
  }

  async actualizarEstado(obraId: string): Promise<void> {
    const obra = await this.findOne(obraId);
    await this.obraRepository.save(obra);
  }
}
