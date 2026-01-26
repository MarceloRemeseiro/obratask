import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrabajadoresService } from './trabajadores.service';
import { TrabajadoresController } from './trabajadores.controller';
import { Trabajador } from '../database/entities/trabajador.entity';
import { TrabajadorAusencia } from '../database/entities/trabajador-ausencia.entity';
import { ObraTrabajador } from '../database/entities/obra-trabajador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trabajador, TrabajadorAusencia, ObraTrabajador])],
  controllers: [TrabajadoresController],
  providers: [TrabajadoresService],
  exports: [TrabajadoresService],
})
export class TrabajadoresModule {}
