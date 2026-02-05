import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class UpdateArchivoDto {
  @ApiPropertyOptional({ example: 'Plano de instalaciones' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  titulo?: string;

  @ApiPropertyOptional({ example: 'Plano actualizado con las modificaciones del cliente' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  descripcion?: string;
}
