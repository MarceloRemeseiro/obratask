import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class UpdateAsignacionDto {
  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2024-06-30' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 'Encargado de la fase de albañilería' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  notas?: string;
}
