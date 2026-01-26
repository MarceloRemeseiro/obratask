import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ArchivosService } from './archivos.service';

@ApiTags('Archivos')
@Controller('archivos')
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir un archivo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        obraId: { type: 'string' },
        tareaId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido exitosamente' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('obraId') obraId?: string,
    @Query('tareaId') tareaId?: string,
  ) {
    return this.archivosService.upload(file, obraId, tareaId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener archivos' })
  @ApiQuery({ name: 'obraId', required: false })
  @ApiQuery({ name: 'tareaId', required: false })
  @ApiResponse({ status: 200, description: 'Lista de archivos' })
  findAll(
    @Query('obraId') obraId?: string,
    @Query('tareaId') tareaId?: string,
  ) {
    return this.archivosService.findAll(obraId, tareaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un archivo por ID' })
  @ApiResponse({ status: 200, description: 'Archivo encontrado' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.archivosService.findOne(id);
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Obtener URL firmada para descargar' })
  @ApiResponse({ status: 200, description: 'URL firmada' })
  getSignedUrl(@Param('id', ParseUUIDPipe) id: string) {
    return this.archivosService.getSignedUrl(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un archivo' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.archivosService.remove(id);
  }
}
