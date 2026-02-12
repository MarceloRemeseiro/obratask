import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncargadosController } from './encargados.controller';
import { EncargadosService } from './encargados.service';
import { Trabajador } from '../database/entities/trabajador.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { TareaComentario } from '../database/entities/tarea-comentario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trabajador, Tarea, TareaComentario])],
  controllers: [EncargadosController],
  providers: [EncargadosService],
})
export class EncargadosModule {}
