import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTareaDto } from './create-tarea.dto';
import { EstadoTarea } from '../../database/entities/tarea.entity';

export class UpdateTareaDto extends PartialType(CreateTareaDto) {
  @ApiPropertyOptional({ enum: EstadoTarea, example: 'EN_PROGRESO' })
  @IsOptional()
  @IsEnum(EstadoTarea)
  estado?: EstadoTarea;
}
