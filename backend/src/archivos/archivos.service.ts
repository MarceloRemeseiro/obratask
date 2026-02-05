import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { Archivo, TipoArchivo } from '../database/entities/archivo.entity';
import { UpdateArchivoDto } from './dto/update-archivo.dto';

@Injectable()
export class ArchivosService {
  private s3Client: S3Client;
  private bucket: string;
  private publicEndpoint: string;

  constructor(
    @InjectRepository(Archivo)
    private archivoRepository: Repository<Archivo>,
    private configService: ConfigService,
  ) {
    const endpoint = configService.get('MINIO_ENDPOINT');
    const port = configService.get('MINIO_PORT');
    const useSSL = configService.get('MINIO_USE_SSL') === 'true';

    const internalEndpoint = `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
    this.bucket = configService.get('MINIO_BUCKET') || 'obratask';

    // Public URL for accessing files (use MINIO_PUBLIC_URL in production)
    this.publicEndpoint = configService.get('MINIO_PUBLIC_URL') || internalEndpoint;

    this.s3Client = new S3Client({
      endpoint: internalEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
        secretAccessKey: configService.get('MINIO_SECRET_KEY') || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async upload(
    file: Express.Multer.File,
    obraId?: string,
    tareaId?: string,
    titulo?: string,
    descripcion?: string,
  ): Promise<Archivo> {
    const fileKey = `${uuid()}-${file.originalname}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // Determine if it's a photo based on mimetype
    const isImage = file.mimetype.startsWith('image/');
    const tipoArchivo = isImage ? TipoArchivo.FOTO : TipoArchivo.DOCUMENTO;

    const archivo = this.archivoRepository.create({
      nombre: fileKey,
      nombreOriginal: file.originalname,
      titulo: titulo || file.originalname,
      descripcion,
      tipo: file.mimetype,
      tipoArchivo,
      url: `${this.publicEndpoint}/${this.bucket}/${fileKey}`,
      tamanio: file.size,
      obraId,
      tareaId,
    });

    return this.archivoRepository.save(archivo);
  }

  async findAll(obraId?: string, tareaId?: string, tipoArchivo?: TipoArchivo): Promise<Archivo[]> {
    const where: any = {};
    if (obraId) where.obraId = obraId;
    if (tareaId) where.tareaId = tareaId;
    if (tipoArchivo) where.tipoArchivo = tipoArchivo;

    return this.archivoRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateArchivoDto: UpdateArchivoDto): Promise<Archivo> {
    const archivo = await this.findOne(id);
    Object.assign(archivo, updateArchivoDto);
    return this.archivoRepository.save(archivo);
  }

  async findOne(id: string): Promise<Archivo> {
    const archivo = await this.archivoRepository.findOne({ where: { id } });
    if (!archivo) {
      throw new NotFoundException(`Archivo con ID ${id} no encontrado`);
    }
    return archivo;
  }

  async getSignedUrl(id: string): Promise<string> {
    const archivo = await this.findOne(id);
    // Return public URL directly (bucket has public read access)
    return `${this.publicEndpoint}/${this.bucket}/${archivo.nombre}`;
  }

  async remove(id: string): Promise<void> {
    const archivo = await this.findOne(id);

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: archivo.nombre,
      }),
    );

    await this.archivoRepository.remove(archivo);
  }
}
