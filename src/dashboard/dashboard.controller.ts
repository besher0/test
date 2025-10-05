import {
  Controller,
  Get,
  Query,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { BusinessType } from '../common/business-type.enum';
import { RestaurantService } from '../restaurant/restaurant.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
// no-op

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly restaurantService: RestaurantService,
  ) {}

  // Admin landing widget API
  @Get('adminHomePage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  adminHomePage() {
    return this.dashboardService.getAdminHomePage();
  }

  // Accounts management list with filtering by userType
  @Get('accountManagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'userType',
    enum: ['normalUser', 'restaurant', 'store'],
    required: true,
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  accountManagement(
    @Query('userType') userType: 'normalUser' | 'restaurant' | 'store',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.dashboardService.getAccountManagement({
      userType,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(100, Math.max(1, Number(limit) || 10)),
    });
  }

  // Content moderation feed
  @Get('getContent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'type',
    enum: ['posts', 'reels', 'stories'],
    required: true,
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getContent(
    @Query('type') type: 'posts' | 'reels' | 'stories',
    @Query('page') page = '1',
    @Query('limit') limit = '24',
  ) {
    return this.dashboardService.getContent({
      type,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(100, Math.max(1, Number(limit) || 24)),
    });
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'businessType',
    enum: ['restaurant', 'store'],
    required: false,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO date (inclusive)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO date (inclusive)',
  })
  overview(
    @Query('businessType') businessType?: BusinessType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const range = this.parseRange(from, to);
    return this.dashboardService.getOverview({ businessType, ...range });
  }

  @Get('top-restaurants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'businessType',
    enum: ['restaurant', 'store'],
    required: true,
  })
  @ApiQuery({ name: 'metric', enum: ['orders', 'revenue'], required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  topRestaurants(
    @Query('businessType') businessType: BusinessType,
    @Query('metric') metric: 'orders' | 'revenue' = 'orders',
    @Query('limit') limit = '7',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const range = this.parseRange(from, to);
    return this.dashboardService.getTopRestaurants({
      businessType,
      metric,
      limit: Number(limit) || 7,
      ...range,
    });
  }

  @Get('top-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'businessType',
    enum: ['restaurant', 'store'],
    required: true,
  })
  @ApiQuery({ name: 'limit', required: false })
  topCategories(
    @Query('businessType') businessType: BusinessType,
    @Query('limit') limit = '7',
  ) {
    return this.dashboardService.getTopCategories({
      businessType,
      limit: Number(limit) || 7,
    });
  }

  @Get('top-countries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'businessType',
    enum: ['restaurant', 'store'],
    required: true,
  })
  @ApiQuery({ name: 'limit', required: false })
  topCountries(
    @Query('businessType') businessType: BusinessType,
    @Query('limit') limit = '7',
  ) {
    return this.dashboardService.getTopCountries({
      businessType,
      limit: Number(limit) || 7,
    });
  }

  private parseRange(from?: string, to?: string) {
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) fromDate = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) toDate = d;
    }
    return { from: fromDate, to: toDate };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('restaurants/:id/approve')
  @ApiBearerAuth()
  approveRestaurant(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.restaurantService.approveRestaurant(id, admin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('restaurants/:id/reject')
  @ApiBearerAuth()
  rejectRestaurant(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() admin: User,
  ) {
    return this.restaurantService.rejectRestaurant(id, admin, body?.reason);
  }
}
