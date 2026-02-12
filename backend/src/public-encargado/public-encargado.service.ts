import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Trabajador } from '../database/entities/trabajador.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { TareaComentario } from '../database/entities/tarea-comentario.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { AutorComentario, EstadoTarea } from '../database/entities/enums';
import { ArchivosService } from '../archivos/archivos.service';

@Injectable()
export class PublicEncargadoService {
  constructor(
    @InjectRepository(Trabajador)
    private trabajadorRepo: Repository<Trabajador>,
    @InjectRepository(Tarea)
    private tareaRepo: Repository<Tarea>,
    @InjectRepository(TareaComentario)
    private comentarioRepo: Repository<TareaComentario>,
    @InjectRepository(ObraTrabajador)
    private obraTrabajadorRepo: Repository<ObraTrabajador>,
    private archivosService: ArchivosService,
  ) {}

  private async getEncargadoObraIds(encargadoId: string): Promise<string[]> {
    const assignments = await this.obraTrabajadorRepo.find({
      where: { trabajadorId: encargadoId },
      select: ['obraId'],
    });
    return assignments.map((a) => a.obraId);
  }

  async verifyAndGetEncargado(token: string, pin: string) {
    const encargado = await this.trabajadorRepo.findOne({
      where: { publicToken: token, esEncargado: true },
    });

    if (!encargado) {
      throw new UnauthorizedException('Token inválido');
    }

    if (encargado.pin && encargado.pin !== pin) {
      throw new UnauthorizedException('PIN incorrecto');
    }

    const obraIds = await this.getEncargadoObraIds(encargado.id);

    if (obraIds.length === 0) {
      return {
        encargado: {
          id: encargado.id,
          nombre: encargado.nombre,
          cargo: encargado.cargo,
        },
        misTareas: [],
        tareasEquipo: [],
      };
    }

    const allTareas = await this.tareaRepo.find({
      where: { obraId: In(obraIds) },
      relations: ['obra', 'subtareas', 'comentarios', 'trabajador'],
      order: { createdAt: 'DESC' },
    });

    const addUnread = (tarea: Tarea) => {
      const unreadCount = (tarea.comentarios || []).filter(
        (c) => c.autor === AutorComentario.ADMIN && !c.leidoPorEncargado,
      ).length;
      return { ...tarea, unreadCount };
    };

    const misTareas = allTareas
      .filter((t) => t.trabajadorId === encargado.id)
      .map(addUnread);
    const tareasEquipo = allTareas
      .filter((t) => t.trabajadorId !== encargado.id)
      .map(addUnread);

    return {
      encargado: {
        id: encargado.id,
        nombre: encargado.nombre,
        cargo: encargado.cargo,
      },
      misTareas,
      tareasEquipo,
    };
  }

  private async validateAccess(
    token: string,
    pin: string,
    tareaId: string,
  ): Promise<{ encargado: Trabajador; tarea: Tarea }> {
    const encargado = await this.trabajadorRepo.findOne({
      where: { publicToken: token, esEncargado: true },
    });

    if (!encargado) {
      throw new UnauthorizedException('Token inválido');
    }

    if (encargado.pin && encargado.pin !== pin) {
      throw new UnauthorizedException('PIN incorrecto');
    }

    const tarea = await this.tareaRepo.findOne({
      where: { id: tareaId },
    });

    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${tareaId} no encontrada`);
    }

    const obraIds = await this.getEncargadoObraIds(encargado.id);
    if (!obraIds.includes(tarea.obraId)) {
      throw new ForbiddenException('No tienes acceso a esta tarea');
    }

    return { encargado, tarea };
  }

  async updateTareaEstado(
    token: string,
    pin: string,
    tareaId: string,
    estado: EstadoTarea,
  ) {
    const { tarea } = await this.validateAccess(token, pin, tareaId);
    tarea.estado = estado;
    return this.tareaRepo.save(tarea);
  }

  async createComentario(
    token: string,
    pin: string,
    tareaId: string,
    texto: string,
  ) {
    const { encargado } = await this.validateAccess(token, pin, tareaId);

    const comentario = this.comentarioRepo.create({
      texto,
      autor: AutorComentario.ENCARGADO,
      autorNombre: encargado.nombre,
      tareaId,
      leidoPorAdmin: false,
      leidoPorEncargado: true,
    });

    return this.comentarioRepo.save(comentario);
  }

  async uploadFoto(
    token: string,
    pin: string,
    tareaId: string,
    file: Express.Multer.File,
  ) {
    const { tarea } = await this.validateAccess(token, pin, tareaId);
    return this.archivosService.upload(file, tarea.obraId, tareaId);
  }

  async getComentarios(token: string, pin: string, tareaId: string) {
    await this.validateAccess(token, pin, tareaId);

    // Mark admin comments as read by encargado
    await this.comentarioRepo.update(
      { tareaId, autor: AutorComentario.ADMIN, leidoPorEncargado: false },
      { leidoPorEncargado: true },
    );

    return this.comentarioRepo.find({
      where: { tareaId },
      order: { createdAt: 'ASC' },
    });
  }
}
