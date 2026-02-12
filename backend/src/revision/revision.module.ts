import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionController } from './revision.controller';
import { RevisionService } from './revision.service';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';
import { Obra } from '../database/entities/obra.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { TareaComentario } from '../database/entities/tarea-comentario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrabajadorAusencia,
      Obra,
      ObraTrabajador,
      Tarea,
      TareaComentario,
    ]),
  ],
  controllers: [RevisionController],
  providers: [RevisionService],
  exports: [RevisionService],
})
export class RevisionModule {}
