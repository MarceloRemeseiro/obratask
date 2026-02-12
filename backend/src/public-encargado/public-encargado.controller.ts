import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Headers,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { PublicEncargadoService } from './public-encargado.service';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { UpdateTareaEstadoDto } from './dto/update-tarea-estado.dto';
import { CreateComentarioPublicoDto } from './dto/create-comentario-publico.dto';

@ApiTags('Public Encargado')
@Public()
@Controller('public/encargado')
export class PublicEncargadoController {
  constructor(
    private readonly publicEncargadoService: PublicEncargadoService,
  ) {}

  @Post(':token/verify')
  @ApiOperation({ summary: 'Verificar token y PIN de encargado' })
  @ApiResponse({ status: 200, description: 'Encargado verificado con sus tareas' })
  @ApiResponse({ status: 401, description: 'Token o PIN inválido' })
  verify(
    @Param('token') token: string,
    @Body() dto: VerifyPinDto,
  ) {
    return this.publicEncargadoService.verifyAndGetEncargado(token, dto.pin);
  }

  @Patch(':token/tareas/:tareaId')
  @ApiOperation({ summary: 'Actualizar estado de tarea (como encargado)' })
  @ApiHeader({ name: 'x-pin', required: true })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  updateTareaEstado(
    @Param('token') token: string,
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Headers('x-pin') pin: string,
    @Body() dto: UpdateTareaEstadoDto,
  ) {
    return this.publicEncargadoService.updateTareaEstado(
      token,
      pin,
      tareaId,
      dto.estado,
    );
  }

  @Post(':token/tareas/:tareaId/comentarios')
  @ApiOperation({ summary: 'Crear comentario en tarea (como encargado)' })
  @ApiHeader({ name: 'x-pin', required: true })
  @ApiResponse({ status: 201, description: 'Comentario creado' })
  createComentario(
    @Param('token') token: string,
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Headers('x-pin') pin: string,
    @Body() dto: CreateComentarioPublicoDto,
  ) {
    return this.publicEncargadoService.createComentario(
      token,
      pin,
      tareaId,
      dto.texto,
    );
  }

  @Post(':token/tareas/:tareaId/fotos')
  @ApiOperation({ summary: 'Subir foto a tarea (como encargado)' })
  @ApiHeader({ name: 'x-pin', required: true })
  @ApiResponse({ status: 201, description: 'Foto subida' })
  @UseInterceptors(FileInterceptor('file'))
  uploadFoto(
    @Param('token') token: string,
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Headers('x-pin') pin: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.publicEncargadoService.uploadFoto(token, pin, tareaId, file);
  }

  @Get(':token/tareas/:tareaId/comentarios')
  @ApiOperation({ summary: 'Obtener comentarios de tarea (como encargado)' })
  @ApiHeader({ name: 'x-pin', required: true })
  @ApiResponse({ status: 200, description: 'Lista de comentarios' })
  getComentarios(
    @Param('token') token: string,
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Headers('x-pin') pin: string,
  ) {
    return this.publicEncargadoService.getComentarios(token, pin, tareaId);
  }
}
