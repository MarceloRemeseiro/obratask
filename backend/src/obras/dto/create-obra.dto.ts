import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateObraDto {
  @ApiProperty({ example: 'Reforma Edificio Central' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Reforma completa del edificio principal' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  fechaInicioPrev?: string;

  @ApiPropertyOptional({ example: '2024-06-30' })
  @IsOptional()
  @IsDateString()
  fechaFinPrev?: string;

  @ApiPropertyOptional({ example: '2024-01-20' })
  @IsOptional()
  @IsDateString()
  fechaInicioReal?: string;

  @ApiPropertyOptional({ example: '2024-07-15' })
  @IsOptional()
  @IsDateString()
  fechaFinReal?: string;
}
