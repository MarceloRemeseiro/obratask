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
import { TrabajadoresService } from './trabajadores.service';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { CreateAusenciaDto } from './dto/create-ausencia.dto';

@ApiTags('Trabajadores')
@Controller('trabajadores')
export class TrabajadoresController {
  constructor(private readonly trabajadoresService: TrabajadoresService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo trabajador' })
  @ApiResponse({ status: 201, description: 'Trabajador creado exitosamente' })
  create(@Body() createTrabajadorDto: CreateTrabajadorDto) {
    return this.trabajadoresService.create(createTrabajadorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los trabajadores' })
  @ApiResponse({ status: 200, description: 'Lista de trabajadores' })
  findAll() {
    return this.trabajadoresService.findAll();
  }

  @Get('ausencias')
  @ApiOperation({ summary: 'Obtener todas las ausencias de todos los trabajadores' })
  @ApiResponse({ status: 200, description: 'Lista de ausencias' })
  findAllAusencias() {
    return this.trabajadoresService.findAllAusencias();
  }

  // Ausencias endpoints - must come before :id routes to match correctly
  @Get(':id/ausencias')
  @ApiOperation({ summary: 'Obtener ausencias de un trabajador' })
  @ApiResponse({ status: 200, description: 'Lista de ausencias' })
  findAusencias(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.findAusencias(id);
  }

  @Post(':id/ausencias')
  @ApiOperation({ summary: 'Crear una ausencia para un trabajador' })
  @ApiResponse({ status: 201, description: 'Ausencia creada' })
  createAusencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createAusenciaDto: CreateAusenciaDto,
  ) {
    return this.trabajadoresService.createAusencia(id, createAusenciaDto);
  }

  @Patch(':id/ausencias/:ausenciaId')
  @ApiOperation({ summary: 'Actualizar una ausencia' })
  @ApiResponse({ status: 200, description: 'Ausencia actualizada' })
  updateAusencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ausenciaId', ParseUUIDPipe) ausenciaId: string,
    @Body() updateAusenciaDto: Partial<CreateAusenciaDto>,
  ) {
    return this.trabajadoresService.updateAusencia(id, ausenciaId, updateAusenciaDto);
  }

  @Delete(':id/ausencias/:ausenciaId')
  @ApiOperation({ summary: 'Eliminar una ausencia' })
  @ApiResponse({ status: 200, description: 'Ausencia eliminada' })
  removeAusencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ausenciaId', ParseUUIDPipe) ausenciaId: string,
  ) {
    return this.trabajadoresService.removeAusencia(id, ausenciaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un trabajador por ID' })
  @ApiResponse({ status: 200, description: 'Trabajador encontrado' })
  @ApiResponse({ status: 404, description: 'Trabajador no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un trabajador' })
  @ApiResponse({ status: 200, description: 'Trabajador actualizado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTrabajadorDto: UpdateTrabajadorDto,
  ) {
    return this.trabajadoresService.update(id, updateTrabajadorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un trabajador' })
  @ApiResponse({ status: 200, description: 'Trabajador eliminado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.remove(id);
  }
}
