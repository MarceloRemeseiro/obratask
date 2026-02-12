import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';
import { Obra } from '../database/entities/obra.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { TareaComentario } from '../database/entities/tarea-comentario.entity';
import { EstadoObra, EstadoTarea, AutorComentario } from '../database/entities/enums';
import {
  RevisionResponseDto,
  RevisionCountsDto,
  TrabajadorBajaDto,
  ObraSinPersonalDto,
  ObraListaCerrarDto,
  AsignacionPendienteDto,
  TareaVencidaDto,
  ObraVencidaDto,
  ComentarioSinLeerDto,
} from './dto/revision-response.dto';

@Injectable()
export class RevisionService {
  constructor(
    @InjectRepository(TrabajadorAusencia)
    private ausenciaRepository: Repository<TrabajadorAusencia>,
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
    @InjectRepository(ObraTrabajador)
    private obraTrabajadorRepository: Repository<ObraTrabajador>,
    @InjectRepository(Tarea)
    private tareaRepository: Repository<Tarea>,
    @InjectRepository(TareaComentario)
    private comentarioRepository: Repository<TareaComentario>,
  ) {}

  async getRevision(): Promise<RevisionResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      trabajadoresBaja,
      obrasSinPersonal,
      obrasListasCerrar,
      asignacionesPendientes,
      tareasVencidas,
      obrasVencidas,
      comentariosSinLeer,
    ] = await Promise.all([
      this.getTrabajadoresBaja(today),
      this.getObrasSinPersonal(),
      this.getObrasListasCerrar(),
      this.getAsignacionesPendientes(),
      this.getTareasVencidas(today),
      this.getObrasVencidas(today),
      this.getComentariosSinLeer(),
    ]);

    const counts: RevisionCountsDto = {
      trabajadoresBaja: trabajadoresBaja.length,
      obrasSinPersonal: obrasSinPersonal.length,
      obrasListasCerrar: obrasListasCerrar.length,
      asignacionesPendientes: asignacionesPendientes.length,
      tareasVencidas: tareasVencidas.length,
      obrasVencidas: obrasVencidas.length,
      comentariosSinLeer: comentariosSinLeer.length,
      total:
        trabajadoresBaja.length +
        obrasSinPersonal.length +
        obrasListasCerrar.length +
        asignacionesPendientes.length +
        tareasVencidas.length +
        obrasVencidas.length +
        comentariosSinLeer.length,
    };

    return {
      counts,
      trabajadoresBaja,
      obrasSinPersonal,
      obrasListasCerrar,
      asignacionesPendientes,
      tareasVencidas,
      obrasVencidas,
      comentariosSinLeer,
    };
  }

  async getCounts(): Promise<RevisionCountsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      trabajadoresBaja,
      obrasSinPersonal,
      obrasListasCerrar,
      asignacionesPendientes,
      tareasVencidas,
      obrasVencidas,
      comentariosSinLeer,
    ] = await Promise.all([
      this.countTrabajadoresBaja(today),
      this.countObrasSinPersonal(),
      this.countObrasListasCerrar(),
      this.countAsignacionesPendientes(),
      this.countTareasVencidas(today),
      this.countObrasVencidas(today),
      this.countComentariosSinLeer(),
    ]);

    return {
      trabajadoresBaja,
      obrasSinPersonal,
      obrasListasCerrar,
      asignacionesPendientes,
      tareasVencidas,
      obrasVencidas,
      comentariosSinLeer,
      total:
        trabajadoresBaja +
        obrasSinPersonal +
        obrasListasCerrar +
        asignacionesPendientes +
        tareasVencidas +
        obrasVencidas +
        comentariosSinLeer,
    };
  }

  private async getTrabajadoresBaja(today: Date): Promise<TrabajadorBajaDto[]> {
    const ausencias = await this.ausenciaRepository
      .createQueryBuilder('ausencia')
      .leftJoinAndSelect('ausencia.trabajador', 'trabajador')
      .where('ausencia.fechaInicio <= :today', { today })
      .andWhere(
        '(ausencia.fechaFin IS NULL OR ausencia.fechaFin >= :today)',
        { today },
      )
      .getMany();

    return ausencias.map((a) => ({
      id: a.trabajador.id,
      nombre: a.trabajador.nombre,
      cargo: a.trabajador.cargo || '',
      tipoAusencia: a.tipo,
      fechaInicio: a.fechaInicio,
      fechaFin: a.fechaFin,
      notas: a.notas,
    }));
  }

  private async countTrabajadoresBaja(today: Date): Promise<number> {
    return this.ausenciaRepository
      .createQueryBuilder('ausencia')
      .where('ausencia.fechaInicio <= :today', { today })
      .andWhere(
        '(ausencia.fechaFin IS NULL OR ausencia.fechaFin >= :today)',
        { today },
      )
      .getCount();
  }

  private async getObrasSinPersonal(): Promise<ObraSinPersonalDto[]> {
    const obrasActivas = await this.obraRepository.find({
      where: {
        estado: In([EstadoObra.SIN_INICIAR, EstadoObra.EN_PROGRESO]),
      },
      relations: ['obrasTrabajador'],
    });

    return obrasActivas
      .filter((obra) => obra.obrasTrabajador.length === 0)
      .map((obra) => ({
        id: obra.id,
        nombre: obra.nombre,
        estado: obra.estado,
        fechaInicioPrev: obra.fechaInicioPrev,
        fechaFinPrev: obra.fechaFinPrev,
      }));
  }

  private async countObrasSinPersonal(): Promise<number> {
    const obrasActivas = await this.obraRepository.find({
      where: {
        estado: In([EstadoObra.SIN_INICIAR, EstadoObra.EN_PROGRESO]),
      },
      relations: ['obrasTrabajador'],
    });

    return obrasActivas.filter((obra) => obra.obrasTrabajador.length === 0).length;
  }

  private async getObrasListasCerrar(): Promise<ObraListaCerrarDto[]> {
    // El estado se calcula dinámicamente, así que hay que cargar las tareas
    const obras = await this.obraRepository.find({
      where: { cerradaManualmente: false },
      relations: ['tareas'],
    });

    // Filtrar las que tienen todas las tareas completadas (y al menos una tarea)
    const obrasListasCerrar = obras.filter((obra) => {
      const tareas = obra.tareas || [];
      if (tareas.length === 0) return false;
      return tareas.every((t) => t.estado === EstadoTarea.COMPLETADO);
    });

    return obrasListasCerrar.map((obra) => ({
      id: obra.id,
      nombre: obra.nombre,
      tareasCompletadas: obra.tareas?.length || 0,
      fechaFinPrev: obra.fechaFinPrev,
    }));
  }

  private async countObrasListasCerrar(): Promise<number> {
    const obras = await this.obraRepository.find({
      where: { cerradaManualmente: false },
      relations: ['tareas'],
    });

    return obras.filter((obra) => {
      const tareas = obra.tareas || [];
      if (tareas.length === 0) return false;
      return tareas.every((t) => t.estado === EstadoTarea.COMPLETADO);
    }).length;
  }

  private async getAsignacionesPendientes(): Promise<AsignacionPendienteDto[]> {
    const asignaciones = await this.obraTrabajadorRepository.find({
      where: { pendienteConfirmacion: true },
      relations: ['obra', 'trabajador'],
    });

    return asignaciones.map((a) => ({
      id: a.id,
      obraId: a.obraId,
      obraNombre: a.obra?.nombre || '',
      trabajadorId: a.trabajadorId,
      trabajadorNombre: a.trabajador?.nombre || '',
      fechaInicio: a.fechaInicio,
      fechaFin: a.fechaFin,
    }));
  }

  private async countAsignacionesPendientes(): Promise<number> {
    return this.obraTrabajadorRepository.count({
      where: { pendienteConfirmacion: true },
    });
  }

  private async getTareasVencidas(today: Date): Promise<TareaVencidaDto[]> {
    const tareas = await this.tareaRepository
      .createQueryBuilder('tarea')
      .leftJoinAndSelect('tarea.obra', 'obra')
      .where('tarea.fechaLimite < :today', { today })
      .andWhere('tarea.estado != :completado', { completado: EstadoTarea.COMPLETADO })
      .getMany();

    return tareas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      obraId: t.obraId,
      obraNombre: t.obra?.nombre || '',
      fechaLimite: t.fechaLimite,
      estado: t.estado,
      prioridad: t.prioridad,
    }));
  }

  private async countTareasVencidas(today: Date): Promise<number> {
    return this.tareaRepository
      .createQueryBuilder('tarea')
      .where('tarea.fechaLimite < :today', { today })
      .andWhere('tarea.estado != :completado', { completado: EstadoTarea.COMPLETADO })
      .getCount();
  }

  private async getObrasVencidas(today: Date): Promise<ObraVencidaDto[]> {
    const obras = await this.obraRepository
      .createQueryBuilder('obra')
      .where('obra.fechaFinPrev < :today', { today })
      .andWhere('obra.estado != :completada', { completada: EstadoObra.COMPLETADA })
      .getMany();

    return obras.map((o) => {
      const fechaFinPrev = new Date(o.fechaFinPrev);
      const diffTime = today.getTime() - fechaFinPrev.getTime();
      const diasVencida = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: o.id,
        nombre: o.nombre,
        estado: o.estado,
        fechaFinPrev: o.fechaFinPrev,
        diasVencida,
      };
    });
  }

  private async countObrasVencidas(today: Date): Promise<number> {
    return this.obraRepository
      .createQueryBuilder('obra')
      .where('obra.fechaFinPrev < :today', { today })
      .andWhere('obra.estado != :completada', { completada: EstadoObra.COMPLETADA })
      .getCount();
  }

  private async getComentariosSinLeer(): Promise<ComentarioSinLeerDto[]> {
    const comentarios = await this.comentarioRepository
      .createQueryBuilder('comentario')
      .leftJoinAndSelect('comentario.tarea', 'tarea')
      .leftJoinAndSelect('tarea.obra', 'obra')
      .where('comentario.autor = :autor', { autor: AutorComentario.ENCARGADO })
      .andWhere('comentario.leidoPorAdmin = false')
      .orderBy('comentario.createdAt', 'DESC')
      .getMany();

    return comentarios.map((c) => ({
      id: c.id,
      texto: c.texto,
      autorNombre: c.autorNombre,
      tareaId: c.tareaId,
      tareaTitulo: c.tarea?.titulo || '',
      obraId: c.tarea?.obraId || '',
      obraNombre: c.tarea?.obra?.nombre || '',
      createdAt: c.createdAt,
    }));
  }

  private async countComentariosSinLeer(): Promise<number> {
    return this.comentarioRepository.count({
      where: { autor: AutorComentario.ENCARGADO, leidoPorAdmin: false },
    });
  }
}
