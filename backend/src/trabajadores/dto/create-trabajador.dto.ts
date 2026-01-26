import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoContrato, TipoCarnet } from '../../database/entities/enums';

export class CreateTrabajadorDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Albañil' })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiPropertyOptional({ example: 'Especialista en acabados' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: '+34 612345678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Contrato
  @ApiPropertyOptional({ enum: TipoContrato, example: TipoContrato.INDEFINIDO })
  @IsOptional()
  @IsEnum(TipoContrato)
  tipoContrato?: TipoContrato;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  fechaInicioContrato?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  fechaFinContrato?: string;

  // Vacaciones
  @ApiPropertyOptional({ example: 22, default: 22 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  diasVacacionesAnuales?: number;

  // Especialidades
  @ApiPropertyOptional({
    example: ['Albañilería', 'Fontanería'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];

  // Carnet de conducir
  @ApiPropertyOptional({ enum: TipoCarnet, example: TipoCarnet.B })
  @IsOptional()
  @IsEnum(TipoCarnet)
  carnetConducir?: TipoCarnet;

  @ApiPropertyOptional({ example: '2028-06-15' })
  @IsOptional()
  @IsDateString()
  carnetConducirVencimiento?: string;

  // Documentación
  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional()
  @IsDateString()
  reconocimientoMedicoVencimiento?: string;

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  formacionPRLVencimiento?: string;
}
