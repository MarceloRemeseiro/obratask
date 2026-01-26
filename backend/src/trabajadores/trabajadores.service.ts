import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trabajador } from '../database/entities/trabajador.entity';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { TipoAusencia } from '../database/entities/enums';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { CreateAusenciaDto } from './dto/create-ausencia.dto';

@Injectable()
export class TrabajadoresService {
  constructor(
    @InjectRepository(Trabajador)
    private trabajadorRepository: Repository<Trabajador>,
    @InjectRepository(TrabajadorAusencia)
    private ausenciaRepository: Repository<TrabajadorAusencia>,
    @InjectRepository(ObraTrabajador)
    private obraTrabajadorRepository: Repository<ObraTrabajador>,
  ) {}

  async create(createTrabajadorDto: CreateTrabajadorDto): Promise<Trabajador> {
    const trabajador = this.trabajadorRepository.create(createTrabajadorDto);
    return this.trabajadorRepository.save(trabajador);
  }

  async findAll(): Promise<Trabajador[]> {
    return this.trabajadorRepository.find({
      relations: ['obrasTrabajador', 'obrasTrabajador.obra', 'ausencias'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Trabajador> {
    const trabajador = await this.trabajadorRepository.findOne({
      where: { id },
      relations: [
        'obrasTrabajador',
        'obrasTrabajador.obra',
        'subtareasAsignadas',
        'ausencias',
      ],
    });
    if (!trabajador) {
      throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
    }
    return trabajador;
  }

  async update(
    id: string,
    updateTrabajadorDto: UpdateTrabajadorDto,
  ): Promise<Trabajador> {
    const trabajador = await this.findOne(id);
    Object.assign(trabajador, updateTrabajadorDto);
    return this.trabajadorRepository.save(trabajador);
  }

  async remove(id: string): Promise<void> {
    const trabajador = await this.findOne(id);
    await this.trabajadorRepository.remove(trabajador);
  }

  // Ausencias
  async findAusencias(trabajadorId: string): Promise<TrabajadorAusencia[]> {
    await this.findOne(trabajadorId); // Verify trabajador exists
    return this.ausenciaRepository.find({
      where: { trabajadorId },
      order: { fechaInicio: 'DESC' },
    });
  }

  async findAllAusencias(): Promise<TrabajadorAusencia[]> {
    return this.ausenciaRepository.find({
      relations: ['trabajador'],
      order: { fechaInicio: 'DESC' },
    });
  }

  async createAusencia(
    trabajadorId: string,
    createAusenciaDto: CreateAusenciaDto,
  ): Promise<TrabajadorAusencia & { asignacionesAfectadas?: { id: string; obraId: string; obraNombre: string; fechaInicio: string; fechaFin?: string }[] }> {
    await this.findOne(trabajadorId); // Verify trabajador exists

    const fechaInicio = new Date(createAusenciaDto.fechaInicio);
    const fechaFin = createAusenciaDto.fechaFin
      ? new Date(createAusenciaDto.fechaFin)
      : null;

    // For vacaciones/permisos, check for conflicting obra assignments (blocking)
    const tiposQueBloquean = [TipoAusencia.VACACIONES, TipoAusencia.PERMISO, TipoAusencia.OTRO];
    if (tiposQueBloquean.includes(createAusenciaDto.tipo)) {
      const conflictos = await this.checkAsignacionesConflicto(
        trabajadorId,
        fechaInicio,
        fechaFin || fechaInicio,
      );

      if (conflictos.length > 0) {
        const obras = conflictos.map(c => c.obra?.nombre || 'Obra').join(', ');
        throw new BadRequestException(
          `El trabajador tiene asignaciones en esas fechas: ${obras}. Primero debes desasignarlo de esas obras.`
        );
      }
    }

    // For bajas (sick leave), check for future assignments and mark them as pending
    const tiposBaja = [TipoAusencia.BAJA_ENFERMEDAD, TipoAusencia.BAJA_ACCIDENTE];
    let asignacionesAfectadas: { id: string; obraId: string; obraNombre: string; fechaInicio: string; fechaFin?: string }[] = [];

    if (tiposBaja.includes(createAusenciaDto.tipo)) {
      // Find current and future obra assignments (from baja start date onwards)
      const asignaciones = await this.obraTrabajadorRepository
        .createQueryBuilder('asignacion')
        .leftJoinAndSelect('asignacion.obra', 'obra')
        .where('asignacion.trabajadorId = :trabajadorId', { trabajadorId })
        .andWhere('(asignacion.fechaFin >= :fechaInicio OR asignacion.fechaFin IS NULL)', { fechaInicio })
        .getMany();

      if (asignaciones.length > 0) {
        // Mark all as pending confirmation
        for (const asignacion of asignaciones) {
          asignacion.pendienteConfirmacion = true;
          await this.obraTrabajadorRepository.save(asignacion);
        }

        asignacionesAfectadas = asignaciones.map(a => ({
          id: a.id,
          obraId: a.obraId,
          obraNombre: a.obra?.nombre || 'Obra',
          fechaInicio: a.fechaInicio instanceof Date ? a.fechaInicio.toISOString() : a.fechaInicio,
          fechaFin: a.fechaFin ? (a.fechaFin instanceof Date ? a.fechaFin.toISOString() : a.fechaFin) : undefined,
        }));
      }
    }

    const ausencia = this.ausenciaRepository.create({
      ...createAusenciaDto,
      trabajadorId,
    });
    const savedAusencia = await this.ausenciaRepository.save(ausencia);

    // Return with affected assignments if any
    if (asignacionesAfectadas.length > 0) {
      return { ...savedAusencia, asignacionesAfectadas };
    }

    return savedAusencia;
  }

  private async checkAsignacionesConflicto(
    trabajadorId: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ObraTrabajador[]> {
    // Find obra assignments that overlap with the given date range
    const asignaciones = await this.obraTrabajadorRepository
      .createQueryBuilder('asignacion')
      .leftJoinAndSelect('asignacion.obra', 'obra')
      .where('asignacion.trabajadorId = :trabajadorId', { trabajadorId })
      .andWhere('asignacion.fechaInicio <= :fechaFin', { fechaFin })
      .andWhere('(asignacion.fechaFin >= :fechaInicio OR asignacion.fechaFin IS NULL)', { fechaInicio })
      .getMany();

    return asignaciones;
  }

  async updateAusencia(
    trabajadorId: string,
    ausenciaId: string,
    updateAusenciaDto: Partial<CreateAusenciaDto>,
  ): Promise<TrabajadorAusencia> {
    const ausencia = await this.ausenciaRepository.findOne({
      where: { id: ausenciaId, trabajadorId },
    });
    if (!ausencia) {
      throw new NotFoundException(`Ausencia con ID ${ausenciaId} no encontrada`);
    }

    // Check if we're giving "alta" (setting fechaFin on a baja)
    const tiposBaja = [TipoAusencia.BAJA_ENFERMEDAD, TipoAusencia.BAJA_ACCIDENTE];
    const esBaja = tiposBaja.includes(ausencia.tipo);
    const estaDandoAlta = esBaja && !ausencia.fechaFin && updateAusenciaDto.fechaFin;

    Object.assign(ausencia, updateAusenciaDto);
    const savedAusencia = await this.ausenciaRepository.save(ausencia);

    // If giving alta, auto-confirm pending obra assignments
    if (estaDandoAlta) {
      await this.confirmarAsignacionesPendientes(trabajadorId);
    }

    return savedAusencia;
  }

  private async confirmarAsignacionesPendientes(trabajadorId: string): Promise<void> {
    // Find all pending assignments for this worker
    const asignacionesPendientes = await this.obraTrabajadorRepository.find({
      where: {
        trabajadorId,
        pendienteConfirmacion: true,
      },
    });

    // Confirm all of them
    for (const asignacion of asignacionesPendientes) {
      asignacion.pendienteConfirmacion = false;
      await this.obraTrabajadorRepository.save(asignacion);
    }
  }

  async removeAusencia(trabajadorId: string, ausenciaId: string): Promise<void> {
    // First verify the trabajador exists
    await this.findOne(trabajadorId);

    // Find the ausencia
    const ausencia = await this.ausenciaRepository.findOne({
      where: { id: ausenciaId },
    });

    if (!ausencia) {
      throw new NotFoundException(`Ausencia con ID ${ausenciaId} no encontrada`);
    }

    // Verify the ausencia belongs to this trabajador
    if (ausencia.trabajadorId !== trabajadorId) {
      throw new NotFoundException(`Ausencia con ID ${ausenciaId} no encontrada para este trabajador`);
    }

    await this.ausenciaRepository.remove(ausencia);
  }
}
