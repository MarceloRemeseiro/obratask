import { IsArray, IsUUID, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TareaOrden {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsNumber()
  orden: number;
}

export class ReordenarTareasDto {
  @ApiProperty({ type: [TareaOrden] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TareaOrden)
  tareas: TareaOrden[];
}
