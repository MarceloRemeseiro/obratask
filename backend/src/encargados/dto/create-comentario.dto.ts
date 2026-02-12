import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComentarioDto {
  @ApiProperty({ example: 'El material ya fue entregado' })
  @IsString()
  @IsNotEmpty()
  texto: string;
}
