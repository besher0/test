import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
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
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration data',
  })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: '11111111-1111-4111-8111-111111111111',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        userType: 'normalUser',
        // ... other fields as per DTO
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request if validation fails',
    schema: {
      example: {
        statusCode: 400,
        message: ['First name must be at least 3 characters long'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict if email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      },
    },
  })
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
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
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
        message: [
          'Email must be valid',
          'Password must be at least 6 characters long',
        ],
        error: 'Bad Request',
      },
    },
  })
  login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      example: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          userType: 'normalUser',
          // ... other fields
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    schema: {
      example: {
        id: '11111111-1111-4111-8111-111111111111',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        userType: 'normalUser',
        // ... other fields
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated user',
    schema: {
      example: {
        id: '11111111-1111-4111-8111-111111111111',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@updated.com',
        userType: 'admin',
        // ... other updated fields
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Not authorized to update this user',
    schema: {
      example: {
        statusCode: 403,
        message: 'غير مصرح لك بتحديث هذا المستخدم',
        error: 'Forbidden',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id !== id && currentUser.userType !== 'admin') {
      throw new HttpException(
        'غير مصرح لك بتحديث هذا المستخدم',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        message: 'User deleted successfully',
        id: '11111111-1111-4111-8111-111111111111',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Not authorized to delete this user',
    schema: {
      example: {
        statusCode: 403,
        message: 'غير مصرح لك بحذف هذا المستخدم',
        error: 'Forbidden',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    if (currentUser.id !== id && currentUser.userType !== 'admin') {
      throw new HttpException(
        'غير مصرح لك بحذف هذا المستخدم',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.userService.remove(id);
  }
}
