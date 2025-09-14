/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Country } from './county.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new country with image (Cloudinary)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: Country })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() dto: CreateCountryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.countryService.create(dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({
    status: 200,
    description: 'List of all countries',
    schema: {
      example: [
        {
          id: 'uuid-1',
          name: 'Saudi Arabia',
          code: 'SA',
          createdAt: '2025-09-13T10:00:00.000Z',
          updatedAt: '2025-09-13T10:00:00.000Z',
        },
        {
          id: 'uuid-2',
          name: 'Egypt',
          code: 'EG',
          createdAt: '2025-09-13T11:00:00.000Z',
          updatedAt: '2025-09-13T11:00:00.000Z',
        },
      ],
    },
  })
  findAll() {
    return this.countryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a country by ID' })
  @ApiResponse({
    status: 200,
    description: 'Country found',
    schema: {
      example: {
        id: 'uuid-1',
        name: 'Saudi Arabia',
        code: 'SA',
        createdAt: '2025-09-13T10:00:00.000Z',
        updatedAt: '2025-09-13T10:00:00.000Z',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.countryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a country' })
  @ApiBody({
    schema: {
      example: {
        name: 'United Arab Emirates',
        code: 'AE',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Country updated successfully',
    schema: {
      example: {
        id: 'uuid-1',
        name: 'United Arab Emirates',
        code: 'AE',
        createdAt: '2025-09-13T10:00:00.000Z',
        updatedAt: '2025-09-13T12:00:00.000Z',
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a country' })
  @ApiResponse({
    status: 200,
    description: 'Country deleted successfully',
    schema: {
      example: {
        message: 'Country deleted successfully',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.countryService.remove(id);
  }
}
