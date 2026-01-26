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
import { TareasService } from './tareas.service';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { ReordenarTareasDto } from './dto/reordenar-tareas.dto';

@ApiTags('Tareas')
@Controller('obras/:obraId/tareas')
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva tarea en una obra' })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosamente' })
  create(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() createTareaDto: CreateTareaDto,
  ) {
    return this.tareasService.create(obraId, createTareaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas de una obra' })
  @ApiResponse({ status: 200, description: 'Lista de tareas' })
  findAll(@Param('obraId', ParseUUIDPipe) obraId: string) {
    return this.tareasService.findAllByObra(obraId);
  }

  @Patch('reordenar')
  @ApiOperation({ summary: 'Reordenar tareas de una obra' })
  @ApiResponse({ status: 200, description: 'Tareas reordenadas' })
  reordenar(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() reordenarDto: ReordenarTareasDto,
  ) {
    return this.tareasService.reordenar(obraId, reordenarDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiResponse({ status: 200, description: 'Tarea encontrada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tareasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTareaDto: UpdateTareaDto,
  ) {
    return this.tareasService.update(id, updateTareaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiResponse({ status: 200, description: 'Tarea eliminada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tareasService.remove(id);
  }
}
