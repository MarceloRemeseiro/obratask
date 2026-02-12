import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trabajador } from '../database/entities/trabajador.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { TareaComentario } from '../database/entities/tarea-comentario.entity';
import { AutorComentario } from '../database/entities/enums';

@Injectable()
export class EncargadosService {
  constructor(
    @InjectRepository(Trabajador)
    private trabajadorRepo: Repository<Trabajador>,
    @InjectRepository(Tarea)
    private tareaRepo: Repository<Tarea>,
    @InjectRepository(TareaComentario)
    private comentarioRepo: Repository<TareaComentario>,
  ) {}

  async findAll() {
    const encargados = await this.trabajadorRepo.find({
      where: { esEncargado: true },
      order: { nombre: 'ASC' },
    });

    const result: any[] = [];
    for (const enc of encargados) {
      const tareas = await this.tareaRepo.find({
        where: { trabajadorId: enc.id },
      });

      const pendientes = tareas.filter((t) => t.estado === 'PENDIENTE').length;
      const enProgreso = tareas.filter((t) => t.estado === 'EN_PROGRESO').length;
      const completadas = tareas.filter((t) => t.estado === 'COMPLETADO').length;

      result.push({
        id: enc.id,
        nombre: enc.nombre,
        cargo: enc.cargo,
        telefono: enc.telefono,
        publicToken: enc.publicToken,
        pin: enc.pin,
        tareas: {
          pendientes,
          enProgreso,
          completadas,
          total: tareas.length,
        },
      });
    }

    return result;
  }

  async findOne(id: string) {
    const encargado = await this.trabajadorRepo.findOne({
      where: { id, esEncargado: true },
    });
    if (!encargado) {
      throw new NotFoundException(`Encargado con ID ${id} no encontrado`);
    }

    const tareas = await this.tareaRepo.find({
      where: { trabajadorId: id },
      relations: ['obra', 'subtareas', 'archivos', 'comentarios'],
      order: { createdAt: 'DESC' },
    });

    // Group tareas by obra
    const tareasPorObra: Record<string, { obra: { id: string; nombre: string }; tareas: typeof tareas }> = {};
    for (const tarea of tareas) {
      const obraId = tarea.obraId;
      if (!tareasPorObra[obraId]) {
        tareasPorObra[obraId] = {
          obra: { id: tarea.obra.id, nombre: tarea.obra.nombre },
          tareas: [],
        };
      }
      tareasPorObra[obraId].tareas.push(tarea);
    }

    return {
      id: encargado.id,
      nombre: encargado.nombre,
      cargo: encargado.cargo,
      telefono: encargado.telefono,
      publicToken: encargado.publicToken,
      pin: encargado.pin,
      tareasPorObra: Object.values(tareasPorObra),
    };
  }

  async findComentarios(tareaId: string) {
    // Mark encargado comments as read by admin
    await this.comentarioRepo.update(
      { tareaId, autor: AutorComentario.ENCARGADO, leidoPorAdmin: false },
      { leidoPorAdmin: true },
    );

    return this.comentarioRepo.find({
      where: { tareaId },
      order: { createdAt: 'ASC' },
    });
  }

  async createComentario(tareaId: string, texto: string) {
    const tarea = await this.tareaRepo.findOne({ where: { id: tareaId } });
    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${tareaId} no encontrada`);
    }

    const comentario = this.comentarioRepo.create({
      texto,
      autor: AutorComentario.ADMIN,
      autorNombre: 'Admin',
      tareaId,
      leidoPorAdmin: true,
      leidoPorEncargado: false,
    });

    return this.comentarioRepo.save(comentario);
  }

  async countUnread(): Promise<{ total: number }> {
    const total = await this.comentarioRepo.count({
      where: { autor: AutorComentario.ENCARGADO, leidoPorAdmin: false },
    });
    return { total };
  }
}
