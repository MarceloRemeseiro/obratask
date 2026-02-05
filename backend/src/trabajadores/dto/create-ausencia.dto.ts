import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TipoAusencia } from '../../database/entities/enums';

// Transform empty strings to undefined
const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class CreateAusenciaDto {
  @ApiProperty({ enum: TipoAusencia, example: TipoAusencia.VACACIONES })
  @IsEnum(TipoAusencia)
  tipo: TipoAusencia;

  @ApiProperty({ example: '2024-08-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiPropertyOptional({ example: '2024-08-15' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 'Vacaciones de verano' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  notas?: string;
}
