/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
import { CreateUserPreferencesDto } from '../user-preferences/dto/create-user-preferences.dto';
import { UpdateUserPreferencesDto } from '../user-preferences/dto/update-user-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@ApiTags('user-preferences')
@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user preference' })
  @ApiResponse({ status: 201, description: 'Preference created' })
  create(@Body() createUserPreferencesDto: CreateUserPreferencesDto) {
    return this.userPreferencesService.create(createUserPreferencesDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user preferences' })
  @ApiResponse({ status: 200, description: 'List of preferences' })
  findAll() {
    return this.userPreferencesService.findAll();
  }

@Get(':id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get user preference by ID' })
@ApiResponse({ status: 200, description: 'Preference details' })
findOne(@Param('id') id: string) {
  return this.userPreferencesService.findOne({
    where: { preference_id: +id },
  });
}


  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user preference' })
  @ApiResponse({ status: 200, description: 'Updated preference' })
  update(@Param('id') id: string, @Body() updateUserPreferencesDto: UpdateUserPreferencesDto) {
    return this.userPreferencesService.update(+id, updateUserPreferencesDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user preference' })
  @ApiResponse({ status: 200, description: 'Preference deleted' })
  remove(@Param('id') id: string) {
    return this.userPreferencesService.remove(+id);
  }



}