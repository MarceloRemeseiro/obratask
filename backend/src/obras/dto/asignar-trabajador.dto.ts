import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarTrabajadorDto {
  @ApiProperty({ example: 'uuid-del-trabajador' })
  @IsUUID()
  trabajadorId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  fechaInicio: string;

  @ApiPropertyOptional({ example: '2024-06-30' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 'Encargado de la fase de albañilería' })
  @IsOptional()
  @IsString()
  notas?: string;
}
