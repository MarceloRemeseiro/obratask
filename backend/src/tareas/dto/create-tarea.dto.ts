import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrioridadTarea } from '../../database/entities/tarea.entity';

export class CreateTareaDto {
  @ApiProperty({ example: 'Preparar cimientos' })
  @IsString()
  titulo: string;

  @ApiPropertyOptional({ example: 'Excavar y preparar la base para los cimientos' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ enum: PrioridadTarea, example: 'ALTA' })
  @IsOptional()
  @IsEnum(PrioridadTarea)
  prioridad?: PrioridadTarea;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  orden?: number;

  @ApiPropertyOptional({ example: '2024-02-15' })
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;

  @ApiPropertyOptional({ example: 'uuid-del-trabajador', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.trabajadorId !== null)
  @IsUUID('4', { message: 'trabajadorId debe ser un UUID válido' })
  trabajadorId?: string | null;
}
