import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { BackupService } from './backup.service';
import { TipoArchivo } from '../database/entities/archivo.entity';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  // ─── DATA ──────────────────────────────────────────────────

  @Get('data/export')
  async exportData(@Res() res: Response) {
    const data = await this.backupService.exportData();
    const json = JSON.stringify(data, null, 2);
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="backup-datos-${date}.json"`,
    );
    res.send(json);
  }

  @Post('data/import')
  @UseInterceptors(FileInterceptor('file'))
  async importData(@UploadedFile() file: Express.Multer.File) {
    const data = JSON.parse(file.buffer.toString('utf-8'));
    return this.backupService.importData(data);
  }

  // ─── FOTOS ─────────────────────────────────────────────────

  @Get('fotos/export')
  async exportFotos(@Res() res: Response) {
    const { stream, filename } = await this.backupService.exportFiles(
      TipoArchivo.FOTO,
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    stream.pipe(res);
  }

  @Post('fotos/import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 500 * 1024 * 1024 } }))
  async importFotos(@UploadedFile() file: Express.Multer.File) {
    return this.backupService.importFiles(TipoArchivo.FOTO, file.buffer);
  }

  // ─── DOCUMENTOS ────────────────────────────────────────────

  @Get('documentos/export')
  async exportDocumentos(@Res() res: Response) {
    const { stream, filename } = await this.backupService.exportFiles(
      TipoArchivo.DOCUMENTO,
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    stream.pipe(res);
  }

  @Post('documentos/import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 500 * 1024 * 1024 } }))
  async importDocumentos(@UploadedFile() file: Express.Multer.File) {
    return this.backupService.importFiles(
      TipoArchivo.DOCUMENTO,
      file.buffer,
    );
  }
}
