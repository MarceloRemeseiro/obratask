import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subtarea } from '../database/entities/subtarea.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { CreateSubtareaDto } from './dto/create-subtarea.dto';
import { UpdateSubtareaDto } from './dto/update-subtarea.dto';

@Injectable()
export class SubtareasService {
  constructor(
    @InjectRepository(Subtarea)
    private subtareaRepository: Repository<Subtarea>,
    @InjectRepository(Tarea)
    private tareaRepository: Repository<Tarea>,
  ) {}

  async create(
    tareaId: string,
    createSubtareaDto: CreateSubtareaDto,
  ): Promise<Subtarea> {
    const tarea = await this.tareaRepository.findOne({ where: { id: tareaId } });
    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${tareaId} no encontrada`);
    }

    const subtarea = this.subtareaRepository.create({
      ...createSubtareaDto,
      tareaId,
    });
    return this.subtareaRepository.save(subtarea);
  }

  async findAllByTarea(tareaId: string): Promise<Subtarea[]> {
    return this.subtareaRepository.find({
      where: { tareaId },
      relations: ['trabajador'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Subtarea> {
    const subtarea = await this.subtareaRepository.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!subtarea) {
      throw new NotFoundException(`Subtarea con ID ${id} no encontrada`);
    }
    return subtarea;
  }

  async update(
    id: string,
    updateSubtareaDto: UpdateSubtareaDto,
  ): Promise<Subtarea> {
    const subtarea = await this.findOne(id);
    Object.assign(subtarea, updateSubtareaDto);
    return this.subtareaRepository.save(subtarea);
  }

  async remove(id: string): Promise<void> {
    const subtarea = await this.findOne(id);
    await this.subtareaRepository.remove(subtarea);
  }
}
