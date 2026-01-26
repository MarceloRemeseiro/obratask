import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubtareaDto {
  @ApiProperty({ example: 'Mezclar cemento' })
  @IsString()
  titulo: string;

  @ApiPropertyOptional({ example: 'Preparar mezcla 1:3' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'uuid-del-trabajador' })
  @IsOptional()
  @IsUUID()
  trabajadorId?: string;
}
