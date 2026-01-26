import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObrasService } from './obras.service';
import { ObrasController } from './obras.controller';
import { Obra } from '../database/entities/obra.entity';
import { Tarea } from '../database/entities/tarea.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Obra, Tarea, ObraTrabajador, TrabajadorAusencia])],
  controllers: [ObrasController],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}
