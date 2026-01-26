import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TareasService } from './tareas.service';
import { TareasController } from './tareas.controller';
import { Tarea } from '../database/entities/tarea.entity';
import { Obra } from '../database/entities/obra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tarea, Obra])],
  controllers: [TareasController],
  providers: [TareasService],
  exports: [TareasService],
})
export class TareasModule {}
