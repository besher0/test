/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}
  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('sections')
  async getHomeSections(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user?.id ?? null; // يجي من JWT
    return await this.homeService.getHomeSections(userId);
  }
}
