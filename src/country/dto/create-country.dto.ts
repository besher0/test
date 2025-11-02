import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'السعودية' })
  @IsNotEmpty()
  @IsString()
  name: string;

  // multer files are provided via @UploadedFiles() and not part of the DTO body
  // mark them optional so ValidationPipe won't reject multipart requests
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Country image file',
    required: false,
  })
  @IsOptional()
  image?: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Country logoImage file',
    required: false,
  })
  @IsOptional()
  logoImage?: any;
}
