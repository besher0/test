/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEnum, IsEmail, IsDate, Matches, IsNotEmpty, IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ 
    description: 'First name',
    example: 'John'  // أضفت مثال هنا
  })
  @IsString()
  @MinLength(3, { message: 'First name must be at least 3 characters long' })
  firstName: string;

  @ApiProperty({ 
    description: 'Last name',
    example: 'Doe'  // أضفت مثال
  })
  @IsString()
  @MinLength(3, { message: 'Last name must be at least 3 characters long' })
  lastName: string;

  @ApiProperty({ 
    description: 'Birth date',
    example: '1990-05-15'  // أضفت مثال (تاريخ ISO)
  })
  @IsDate({ message: 'Birth date must be a valid date' })
  birthDate: Date;

  @ApiProperty({ 
    enum: ['male', 'female'], 
    description: 'Gender',
    example: 'male'  // أضفت مثال
  })
  @IsEnum(['male', 'female'], { message: 'Gender must be either male or female' })
  gender: string;

  @ApiProperty({ 
    description: 'Email',
    example: 'john.doe@example.com'  // أضفت مثال
  })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({ 
    description: 'Password',
    example: 'StrongPass123!'  // أضفت مثال
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  password: string;

  @ApiProperty({ 
    description: 'Confirm password',
    example: 'StrongPass123!'  // أضفت مثال (يطابق الـ password)
  })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @ApiProperty({ 
    description: 'Favorite food',
    example: 'برغر'  // أضفت مثال
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf(o => o.userType === 'normalUser')
  @IsNotEmpty({ message: 'Favorite food is required' })
  @IsEnum(['لحمة', 'رز', 'مشروبات', 'حلويات', 'برغر', 'معكرونة'], { message: 'Favorite food must be one of the listed options' })
  favoriteFood?: string;

  @ApiProperty({ 
    enum: ['normalUser', 'admin', 'restaurant', 'store'], 
    description: 'User type',
    example: 'normalUser'  // أضفت مثال
  })
  @IsEnum(['normalUser', 'admin', 'restaurant', 'store'], { message: 'User type must be normalUser, admin, restaurant, or store' })
  userType?: string;

  @ApiProperty({ 
    description: 'Profile picture', 
    required: false,
    example: 'https://example.com/profile.jpg'  // أضفت مثال
  })
  @IsOptional()
  @IsUrl({}, { message: 'Profile picture must be a valid URL' })
  profile_picture?: string;

  // @ApiProperty({ 
  //   description: 'Bio', 
  //   required: false,
  //   example: 'A brief bio about the user.'  // أضفت مثال
  // })
  // @IsOptional()
  // @IsString()
  // bio?: string;

  // @ApiProperty({ 
  //   example: '123456789', 
  //   description: 'Identity number or code' 
  // })
  // Identity?: string;

  // @ApiProperty({ 
  //   example: 'United States', 
  //   description: 'Country of the user' 
  // })
  // country?: string;
}