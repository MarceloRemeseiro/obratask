import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { ArchivosService } from './archivos.service';

@ApiTags('Files Proxy')
@Controller('files')
export class ArchivosProxyController {
  constructor(private readonly archivosService: ArchivosService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Obtener archivo por key (proxy a S3)' })
  @ApiResponse({ status: 200, description: 'Archivo encontrado' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async getFile(@Param('key') key: string, @Res() res: Response) {
    try {
      const { buffer, contentType, contentLength } =
        await this.archivosService.getFileFromS3(key);

      res.set({
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': contentLength,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });

      res.send(buffer);
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new NotFoundException(`Archivo ${key} no encontrado en storage`);
      }
      throw error;
    }
  }
}
