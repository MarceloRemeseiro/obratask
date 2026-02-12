import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsInt,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TipoContrato, TipoCarnet } from '../../database/entities/enums';

// Transform empty strings to undefined
const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class CreateTrabajadorDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Albañil' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  cargo?: string;

  @ApiPropertyOptional({ example: 'Especialista en acabados' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  descripcion?: string;

  @ApiPropertyOptional({ example: '+34 612345678' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsEmail()
  @EmptyToUndefined()
  email?: string;

  // Contrato
  @ApiPropertyOptional({ enum: TipoContrato, example: TipoContrato.INDEFINIDO })
  @IsOptional()
  @IsEnum(TipoContrato)
  @EmptyToUndefined()
  tipoContrato?: TipoContrato;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  fechaInicioContrato?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
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
  @EmptyToUndefined()
  carnetConducir?: TipoCarnet;

  @ApiPropertyOptional({ example: '2028-06-15' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  carnetConducirVencimiento?: string;

  // Documentación
  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  reconocimientoMedicoVencimiento?: string;

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  formacionPRLVencimiento?: string;

  // Encargado
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  esEncargado?: boolean;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  pin?: string;
}
