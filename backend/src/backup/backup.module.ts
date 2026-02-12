import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { Obra } from '../database/entities/obra.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { Subtarea } from '../database/entities/subtarea.entity';
import { Trabajador } from '../database/entities/trabajador.entity';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { Archivo } from '../database/entities/archivo.entity';
import { TareaComentario } from '../database/entities/tarea-comentario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Obra,
      Tarea,
      Subtarea,
      Trabajador,
      TrabajadorAusencia,
      ObraTrabajador,
      Archivo,
      TareaComentario,
    ]),
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
