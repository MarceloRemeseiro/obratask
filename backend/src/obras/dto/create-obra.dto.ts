import { IsString, IsOptional, IsDateString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

// Transform empty strings to undefined
const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class CreateObraDto {
  @ApiProperty({ example: 'Reforma Edificio Central' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Reforma completa del edificio principal' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  descripcion?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaInicioPrev?: string;

  @ApiPropertyOptional({ example: '2024-06-30' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaFinPrev?: string;

  @ApiPropertyOptional({ example: '2024-01-20' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaInicioReal?: string;

  @ApiPropertyOptional({ example: '2024-07-15' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaFinReal?: string;
}
