import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarea, EstadoTarea } from '../database/entities/tarea.entity';
import { Obra } from '../database/entities/obra.entity';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { ReordenarTareasDto } from './dto/reordenar-tareas.dto';

@Injectable()
export class TareasService {
  constructor(
    @InjectRepository(Tarea)
    private tareaRepository: Repository<Tarea>,
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
  ) {}

  async create(obraId: string, createTareaDto: CreateTareaDto): Promise<Tarea> {
    const obra = await this.obraRepository.findOne({ where: { id: obraId } });
    if (!obra) {
      throw new NotFoundException(`Obra con ID ${obraId} no encontrada`);
    }

    const maxOrden = await this.tareaRepository
      .createQueryBuilder('tarea')
      .where('tarea.obraId = :obraId', { obraId })
      .select('MAX(tarea.orden)', 'max')
      .getRawOne();

    const tarea = this.tareaRepository.create({
      ...createTareaDto,
      obraId,
      orden: createTareaDto.orden ?? (maxOrden?.max ?? -1) + 1,
    });
    const savedTarea = await this.tareaRepository.save(tarea);
    // Re-fetch to get relations (e.g., trabajador)
    return this.findOne(savedTarea.id);
  }

  async findAllByObra(obraId: string): Promise<Tarea[]> {
    return this.tareaRepository.find({
      where: { obraId },
      relations: ['subtareas', 'subtareas.trabajador', 'trabajador'],
      order: { orden: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Tarea> {
    const tarea = await this.tareaRepository.findOne({
      where: { id },
      relations: ['subtareas', 'subtareas.trabajador', 'trabajador', 'archivos'],
    });
    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }
    return tarea;
  }

  async update(id: string, updateTareaDto: UpdateTareaDto): Promise<Tarea> {
    const tarea = await this.findOne(id);
    const estadoAnterior = tarea.estado;

    // Limpiar la relación trabajador antes de asignar para evitar conflictos con TypeORM
    delete (tarea as any).trabajador;

    Object.assign(tarea, updateTareaDto);
    await this.tareaRepository.save(tarea);

    // Si el estado cambió de PENDIENTE a EN_PROGRESO o COMPLETADO, actualizar fechaInicioReal de la obra
    if (
      estadoAnterior === EstadoTarea.PENDIENTE &&
      (updateTareaDto.estado === EstadoTarea.EN_PROGRESO ||
        updateTareaDto.estado === EstadoTarea.COMPLETADO)
    ) {
      await this.actualizarFechaInicioObraSiNecesario(tarea.obraId);
    }

    // Re-fetch to get updated relations
    return this.findOne(id);
  }

  private async actualizarFechaInicioObraSiNecesario(obraId: string): Promise<void> {
    const obra = await this.obraRepository.findOne({ where: { id: obraId } });
    if (obra && !obra.fechaInicioReal) {
      obra.fechaInicioReal = new Date();
      await this.obraRepository.save(obra);
    }
  }

  async remove(id: string): Promise<void> {
    const tarea = await this.findOne(id);
    await this.tareaRepository.remove(tarea);
  }

  async reordenar(obraId: string, reordenarDto: ReordenarTareasDto): Promise<Tarea[]> {
    const updates = reordenarDto.tareas.map((item) =>
      this.tareaRepository.update(item.id, { orden: item.orden }),
    );
    await Promise.all(updates);
    return this.findAllByObra(obraId);
  }
}
