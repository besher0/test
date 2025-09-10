/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEnum, IsEmail, IsDate, Matches, IsNotEmpty, IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'First name' })
  @IsString()
  @MinLength(3, { message: 'First name must be at least 3 characters long' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @MinLength(3, { message: 'Last name must be at least 3 characters long' })
  lastName: string;

  @ApiProperty({ description: 'Birth date' })
  @IsDate({ message: 'Birth date must be a valid date' })
  birthDate: Date;

  @ApiProperty({ enum: ['male', 'female'], description: 'Gender' })
  @IsEnum(['male', 'female'], { message: 'Gender must be either male or female' })
  gender: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  password: string;

  @ApiProperty({ description: 'Confirm password' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @ApiProperty({ description: 'Favorite food' })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf(o => o.userType === 'normalUser')
  @IsNotEmpty({ message: 'Favorite food is required' })
  @IsEnum(['meat', 'rice', 'drink', 'dessert', 'burger', 'pastry'], { message: 'Favorite food must be one of the listed options' })
  favoriteFood?: string;

  @ApiProperty({ enum: ['normalUser', 'admin', 'restaurant', 'store'], description: 'User type' })
  @IsEnum(['normalUser', 'admin', 'restaurant', 'store'], { message: 'User type must be normalUser, admin, restaurant, or store' })
  userType?: string;

  @ApiProperty({ description: 'Profile picture', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'Profile picture must be a valid URL' })
  profile_picture?: string;

  @ApiProperty({ description: 'Bio', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

    @ApiProperty({ example: '123456789', description: 'Identity number or code' })
    Identity?: string;
  
    @ApiProperty({ example: 'France', description: 'Country of the user' })
    country?: string;
}
