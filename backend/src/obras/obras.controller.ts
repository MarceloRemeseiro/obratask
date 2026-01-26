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
import { ObrasService } from './obras.service';
import { CreateObraDto } from './dto/create-obra.dto';
import { UpdateObraDto } from './dto/update-obra.dto';
import { AsignarTrabajadorDto } from './dto/asignar-trabajador.dto';

@ApiTags('Obras')
@Controller('obras')
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva obra' })
  @ApiResponse({ status: 201, description: 'Obra creada exitosamente' })
  create(@Body() createObraDto: CreateObraDto) {
    return this.obrasService.create(createObraDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las obras' })
  @ApiResponse({ status: 200, description: 'Lista de obras con estado derivado' })
  findAll() {
    return this.obrasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una obra por ID' })
  @ApiResponse({ status: 200, description: 'Obra encontrada con estado derivado' })
  @ApiResponse({ status: 404, description: 'Obra no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.obrasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una obra' })
  @ApiResponse({ status: 200, description: 'Obra actualizada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateObraDto: UpdateObraDto,
  ) {
    return this.obrasService.update(id, updateObraDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una obra' })
  @ApiResponse({ status: 200, description: 'Obra eliminada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.obrasService.remove(id);
  }

  @Post(':id/cerrar')
  @ApiOperation({ summary: 'Cerrar una obra manualmente' })
  @ApiResponse({ status: 200, description: 'Obra cerrada' })
  @ApiResponse({
    status: 400,
    description: 'La obra no está lista para cerrar',
  })
  cerrarObra(@Param('id', ParseUUIDPipe) id: string) {
    return this.obrasService.cerrarObra(id);
  }

  @Get(':id/trabajadores')
  @ApiOperation({ summary: 'Obtener trabajadores asignados a una obra' })
  @ApiResponse({ status: 200, description: 'Lista de trabajadores asignados' })
  getTrabajadores(@Param('id', ParseUUIDPipe) id: string) {
    return this.obrasService.getTrabajadores(id);
  }

  @Post(':id/trabajadores')
  @ApiOperation({ summary: 'Asignar un trabajador a una obra' })
  @ApiResponse({ status: 201, description: 'Trabajador asignado' })
  asignarTrabajador(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() asignarTrabajadorDto: AsignarTrabajadorDto,
  ) {
    return this.obrasService.asignarTrabajador(id, asignarTrabajadorDto);
  }

  @Delete(':id/trabajadores/:asignacionId')
  @ApiOperation({ summary: 'Desasignar un trabajador de una obra' })
  @ApiResponse({ status: 200, description: 'Trabajador desasignado' })
  desasignarTrabajador(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('asignacionId', ParseUUIDPipe) asignacionId: string,
  ) {
    return this.obrasService.desasignarTrabajador(id, asignacionId);
  }
}
