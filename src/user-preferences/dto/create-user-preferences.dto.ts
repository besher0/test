/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/user/user.entity';


export class CreateUserPreferencesDto {
  @ApiProperty({ description: 'User' })
  @IsNotEmpty()
  user: User;

  @ApiProperty({ description: 'Preference type' })
  @IsString()
  preference_type: string;

  @ApiProperty({ description: 'Preference value' })
  @IsString()
  preference_value: string;
}