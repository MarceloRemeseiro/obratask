import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import archiver = require('archiver');
import AdmZip = require('adm-zip');
import { Readable, PassThrough } from 'stream';

import { Obra } from '../database/entities/obra.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { Subtarea } from '../database/entities/subtarea.entity';
import { Trabajador } from '../database/entities/trabajador.entity';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { Archivo, TipoArchivo } from '../database/entities/archivo.entity';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private s3Client: S3Client;
  private bucket: string;
  private publicEndpoint: string;

  constructor(
    @InjectRepository(Obra)
    private obraRepo: Repository<Obra>,
    @InjectRepository(Tarea)
    private tareaRepo: Repository<Tarea>,
    @InjectRepository(Subtarea)
    private subtareaRepo: Repository<Subtarea>,
    @InjectRepository(Trabajador)
    private trabajadorRepo: Repository<Trabajador>,
    @InjectRepository(TrabajadorAusencia)
    private ausenciaRepo: Repository<TrabajadorAusencia>,
    @InjectRepository(ObraTrabajador)
    private obraTrabajadorRepo: Repository<ObraTrabajador>,
    @InjectRepository(Archivo)
    private archivoRepo: Repository<Archivo>,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    const endpoint = configService.get('MINIO_ENDPOINT');
    const port = configService.get('MINIO_PORT');
    const useSSL = configService.get('MINIO_USE_SSL') === 'true';

    const internalEndpoint = `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
    this.bucket = configService.get('MINIO_BUCKET') || 'obratask';
    this.publicEndpoint =
      configService.get('MINIO_PUBLIC_URL') || internalEndpoint;

    this.s3Client = new S3Client({
      endpoint: internalEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
        secretAccessKey:
          configService.get('MINIO_SECRET_KEY') || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  // ─── DATA EXPORT ───────────────────────────────────────────

  async exportData(): Promise<object> {
    const [
      trabajadores,
      trabajadorAusencias,
      obras,
      tareas,
      subtareas,
      obrasTrabajadores,
      archivos,
    ] = await Promise.all([
      this.trabajadorRepo.find(),
      this.ausenciaRepo.find(),
      this.obraRepo.find(),
      this.tareaRepo.find(),
      this.subtareaRepo.find(),
      this.obraTrabajadorRepo.find(),
      this.archivoRepo.find(),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entities: {
        trabajadores,
        trabajadorAusencias,
        obras,
        tareas,
        subtareas,
        obrasTrabajadores,
        archivos,
      },
    };
  }

  // ─── DATA IMPORT ───────────────────────────────────────────

  async importData(
    data: any,
  ): Promise<{ success: boolean; counts: Record<string, number> }> {
    const { entities } = data;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete children first
      await queryRunner.query('DELETE FROM subtareas');
      await queryRunner.query('DELETE FROM archivos');
      await queryRunner.query('DELETE FROM obras_trabajadores');
      await queryRunner.query('DELETE FROM tareas');
      await queryRunner.query('DELETE FROM trabajador_ausencias');
      await queryRunner.query('DELETE FROM obras');
      await queryRunner.query('DELETE FROM trabajadores');

      const counts: Record<string, number> = {};

      // Insert parents first
      if (entities.trabajadores?.length) {
        await queryRunner.manager.save(Trabajador, entities.trabajadores);
        counts.trabajadores = entities.trabajadores.length;
      }
      if (entities.obras?.length) {
        await queryRunner.manager.save(Obra, entities.obras);
        counts.obras = entities.obras.length;
      }
      if (entities.trabajadorAusencias?.length) {
        await queryRunner.manager.save(
          TrabajadorAusencia,
          entities.trabajadorAusencias,
        );
        counts.trabajadorAusencias = entities.trabajadorAusencias.length;
      }
      if (entities.tareas?.length) {
        await queryRunner.manager.save(Tarea, entities.tareas);
        counts.tareas = entities.tareas.length;
      }
      if (entities.subtareas?.length) {
        await queryRunner.manager.save(Subtarea, entities.subtareas);
        counts.subtareas = entities.subtareas.length;
      }
      if (entities.obrasTrabajadores?.length) {
        await queryRunner.manager.save(
          ObraTrabajador,
          entities.obrasTrabajadores,
        );
        counts.obrasTrabajadores = entities.obrasTrabajadores.length;
      }
      if (entities.archivos?.length) {
        await queryRunner.manager.save(Archivo, entities.archivos);
        counts.archivos = entities.archivos.length;
      }

      await queryRunner.commitTransaction();
      return { success: true, counts };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Data import failed, rolled back', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── FILE EXPORT (fotos or documentos) ─────────────────────

  async exportFiles(
    tipoArchivo: TipoArchivo,
  ): Promise<{ stream: PassThrough; filename: string }> {
    const archivos = await this.archivoRepo.find({
      where: { tipoArchivo },
    });

    const label =
      tipoArchivo === TipoArchivo.FOTO ? 'fotos' : 'documentos';
    const filename = `backup-${label}-${new Date().toISOString().slice(0, 10)}.zip`;

    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 5 } });

    archive.pipe(passThrough);

    // Add metadata
    archive.append(JSON.stringify(archivos, null, 2), {
      name: 'metadata.json',
    });

    // Download each file from MinIO and add to archive
    for (const archivo of archivos) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: archivo.nombre,
          }),
        );
        if (response.Body) {
          archive.append(response.Body as Readable, {
            name: `files/${archivo.nombre}`,
          });
        }
      } catch (error) {
        this.logger.warn(
          `Could not download file ${archivo.nombre}: ${error.message}`,
        );
      }
    }

    archive.finalize();

    return { stream: passThrough, filename };
  }

  // ─── FILE IMPORT (fotos or documentos) ─────────────────────

  async importFiles(
    tipoArchivo: TipoArchivo,
    zipBuffer: Buffer,
  ): Promise<{ success: boolean; count: number }> {
    const zip = new AdmZip(zipBuffer);
    const metadataEntry = zip.getEntry('metadata.json');

    if (!metadataEntry) {
      throw new Error('ZIP no contiene metadata.json');
    }

    const archivosMetadata: Archivo[] = JSON.parse(
      metadataEntry.getData().toString('utf-8'),
    );

    // Delete existing files of this type from MinIO and DB
    const existingArchivos = await this.archivoRepo.find({
      where: { tipoArchivo },
    });

    for (const archivo of existingArchivos) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: archivo.nombre,
          }),
        );
      } catch (error) {
        this.logger.warn(
          `Could not delete file ${archivo.nombre}: ${error.message}`,
        );
      }
    }
    await this.archivoRepo.delete({ tipoArchivo });

    // Upload files from ZIP to MinIO and recreate DB records
    let count = 0;
    for (const meta of archivosMetadata) {
      const fileEntry = zip.getEntry(`files/${meta.nombre}`);
      if (!fileEntry) {
        this.logger.warn(`File ${meta.nombre} not found in ZIP, skipping`);
        continue;
      }

      const fileBuffer = fileEntry.getData();

      // Upload to MinIO
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: meta.nombre,
          Body: fileBuffer,
          ContentType: meta.tipo,
        }),
      );

      // Validate FKs - check if obra/tarea exist
      let obraId: string | undefined = meta.obraId;
      let tareaId: string | undefined = meta.tareaId;

      if (obraId) {
        const obraExists = await this.obraRepo.findOne({
          where: { id: obraId },
        });
        if (!obraExists) obraId = undefined;
      }
      if (tareaId) {
        const tareaExists = await this.tareaRepo.findOne({
          where: { id: tareaId },
        });
        if (!tareaExists) tareaId = undefined;
      }

      // Regenerate URL with current public endpoint
      const url = `${this.publicEndpoint}/${this.bucket}/${meta.nombre}`;

      const archivo = this.archivoRepo.create({
        id: meta.id,
        nombre: meta.nombre,
        nombreOriginal: meta.nombreOriginal,
        titulo: meta.titulo,
        descripcion: meta.descripcion,
        tipo: meta.tipo,
        tipoArchivo: meta.tipoArchivo,
        url,
        tamanio: meta.tamanio,
        obraId,
        tareaId,
      });

      await this.archivoRepo.save(archivo);
      count++;
    }

    return { success: true, count };
  }
}
