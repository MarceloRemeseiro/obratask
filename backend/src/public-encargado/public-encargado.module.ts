import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicEncargadoController } from './public-encargado.controller';
import { PublicEncargadoService } from './public-encargado.service';
import { Trabajador } from '../database/entities/trabajador.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { TareaComentario } from '../database/entities/tarea-comentario.entity';
import { Archivo } from '../database/entities/archivo.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { ArchivosModule } from '../archivos/archivos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trabajador, Tarea, TareaComentario, Archivo, ObraTrabajador]),
    ArchivosModule,
  ],
  controllers: [PublicEncargadoController],
  providers: [PublicEncargadoService],
})
export class PublicEncargadoModule {}
