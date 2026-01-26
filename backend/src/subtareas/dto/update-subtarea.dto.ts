import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSubtareaDto } from './create-subtarea.dto';
import { EstadoTarea } from '../../database/entities/tarea.entity';

export class UpdateSubtareaDto extends PartialType(CreateSubtareaDto) {
  @ApiPropertyOptional({ enum: EstadoTarea, example: 'EN_PROGRESO' })
  @IsOptional()
  @IsEnum(EstadoTarea)
  estado?: EstadoTarea;
}
