import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubtareasService } from './subtareas.service';
import { CreateSubtareaDto } from './dto/create-subtarea.dto';
import { UpdateSubtareaDto } from './dto/update-subtarea.dto';

@ApiTags('Subtareas')
@Controller('tareas/:tareaId/subtareas')
export class SubtareasController {
  constructor(private readonly subtareasService: SubtareasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva subtarea' })
  @ApiResponse({ status: 201, description: 'Subtarea creada exitosamente' })
  create(
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Body() createSubtareaDto: CreateSubtareaDto,
  ) {
    return this.subtareasService.create(tareaId, createSubtareaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las subtareas de una tarea' })
  @ApiResponse({ status: 200, description: 'Lista de subtareas' })
  findAll(@Param('tareaId', ParseUUIDPipe) tareaId: string) {
    return this.subtareasService.findAllByTarea(tareaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una subtarea por ID' })
  @ApiResponse({ status: 200, description: 'Subtarea encontrada' })
  @ApiResponse({ status: 404, description: 'Subtarea no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subtareasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una subtarea' })
  @ApiResponse({ status: 200, description: 'Subtarea actualizada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubtareaDto: UpdateSubtareaDto,
  ) {
    return this.subtareasService.update(id, updateSubtareaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una subtarea' })
  @ApiResponse({ status: 200, description: 'Subtarea eliminada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subtareasService.remove(id);
  }
}
