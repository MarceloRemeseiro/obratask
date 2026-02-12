import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoTarea } from '../../database/entities/enums';

export class UpdateTareaEstadoDto {
  @ApiProperty({ enum: EstadoTarea, example: EstadoTarea.EN_PROGRESO })
  @IsEnum(EstadoTarea)
  estado: EstadoTarea;
}
