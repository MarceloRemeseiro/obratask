import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubtareasService } from './subtareas.service';
import { SubtareasController } from './subtareas.controller';
import { Subtarea } from '../database/entities/subtarea.entity';
import { Tarea } from '../database/entities/tarea.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subtarea, Tarea])],
  controllers: [SubtareasController],
  providers: [SubtareasService],
  exports: [SubtareasService],
})
export class SubtareasModule {}
