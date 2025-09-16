/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString,  } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'السعودية' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Country image file',
    required: false,
  })
  image?: any;

    @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Country logoImage file',
    required: false,
  })
  logoImage?: any;
}
