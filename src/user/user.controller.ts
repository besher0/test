/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from './user.entity';
import { LoginDto } from './dto/login-dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
   @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns JWT token upon successful login',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized if email or password is incorrect',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request if input validation fails',
    schema: {
      example: {
        statusCode: 400,
        message: ['Email must be valid', 'Password must be at least 6 characters long'],
        error: 'Bad Request',
      },
    },
  })
  login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get()
  @UseGuards(JwtAuthGuard,)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto  , @CurrentUser() currentUser: User,) {
     if (currentUser.user_id !== +id && currentUser.userType !== 'admin') {
      throw new HttpException('غير مصرح لك بتحديث هذا المستخدم', HttpStatus.FORBIDDEN);
    }
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard,)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  remove(@Param('id') id: string,    @CurrentUser() currentUser: User,
) {
     if (currentUser.user_id !== +id && currentUser.userType !== 'admin') {
      throw new HttpException('غير مصرح لك بحذف هذا المستخدم', HttpStatus.FORBIDDEN);
    }
    return this.userService.remove(+id);
  }
}