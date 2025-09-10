/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
export class UpdateUserPreferencesDto {
  @ApiProperty({ description: 'Preference type', required: false })
  @IsOptional()
  @IsString()
  preference_type?: string;

  @ApiProperty({ description: 'Preference value', required: false })
  @IsOptional()
  @IsString()
  preference_value?: string;
}