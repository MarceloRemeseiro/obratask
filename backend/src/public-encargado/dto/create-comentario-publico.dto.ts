import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComentarioPublicoDto {
  @ApiProperty({ example: 'Material recibido en obra' })
  @IsString()
  @IsNotEmpty()
  texto: string;
}
