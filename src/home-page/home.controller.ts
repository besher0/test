import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { AuthGuard } from '@nestjs/passport';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BusinessType } from 'src/common/business-type.enum';
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}
  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('sections')
  @ApiQuery({
    name: 'businessType',
    enum: ['restaurant', 'store'],
    required: true,
    description: 'حدد نوع البزنس (restaurant أو store)',
  })
  async getHomeSections(
    @Req() req,
    @Query('businessType') businessType: BusinessType,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user?.id ?? null; // يجي من JWT
    return await this.homeService.getHomeSections(businessType, userId);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('feed')
  @ApiQuery({
    name: 'businessType',
    enum: ['restaurant', 'store'],
    required: true,
    description: 'حدد نوع البزنس (restaurant أو store)',
  })
  async getFeed(
    @Req() req: any,
    @Query('businessType') businessType: BusinessType,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const userId = req.user?.id ?? null;
    return await this.homeService.getFeed(businessType, userId);
  }
}
