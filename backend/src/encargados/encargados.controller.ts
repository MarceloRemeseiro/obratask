import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EncargadosService } from './encargados.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';

@ApiTags('Encargados')
@Controller('encargados')
export class EncargadosController {
  constructor(private readonly encargadosService: EncargadosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los encargados con resumen de tareas' })
  @ApiResponse({ status: 200, description: 'Lista de encargados' })
  findAll() {
    return this.encargadosService.findAll();
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obtener cantidad de comentarios sin leer de encargados' })
  @ApiResponse({ status: 200, description: 'Cantidad de comentarios sin leer' })
  getUnreadCount() {
    return this.encargadosService.countUnread();
  }

  @Get('tareas/:tareaId/comentarios')
  @ApiOperation({ summary: 'Obtener comentarios de una tarea' })
  @ApiResponse({ status: 200, description: 'Lista de comentarios' })
  findComentarios(@Param('tareaId', ParseUUIDPipe) tareaId: string) {
    return this.encargadosService.findComentarios(tareaId);
  }

  @Post('tareas/:tareaId/comentarios')
  @ApiOperation({ summary: 'Crear comentario en una tarea (como admin)' })
  @ApiResponse({ status: 201, description: 'Comentario creado' })
  createComentario(
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Body() dto: CreateComentarioDto,
  ) {
    return this.encargadosService.createComentario(tareaId, dto.texto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un encargado con tareas agrupadas por obra' })
  @ApiResponse({ status: 200, description: 'Detalle del encargado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.encargadosService.findOne(id);
  }
}
