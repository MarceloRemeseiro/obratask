import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPinDto {
  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  pin: string;
}
