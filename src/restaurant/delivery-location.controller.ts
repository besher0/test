import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DeliveryLocation } from './delivery-location.entity';
import { CreateDeliveryLocationDto } from './dto/create-delivery-location.dto';
import { RestaurantService } from './restaurant.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';

@ApiTags('DeliveryLocations')
@ApiBearerAuth()
@Controller('delivery-locations')
@UseGuards(JwtAuthGuard)
export class DeliveryLocationController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post(':restaurantId')
  @ApiOperation({ summary: 'Add a delivery location to a restaurant' })
  @ApiResponse({ status: 201, type: DeliveryLocation })
  async addLocation(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateDeliveryLocationDto,
    @CurrentUser() user: User,
  ): Promise<DeliveryLocation> {
    return this.restaurantService.addDeliveryLocation(
      restaurantId,
      dto,
      user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a delivery location by ID' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async deleteLocation(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    await this.restaurantService.deleteDeliveryLocation(id, user.id);
    return { success: true };
  }

  @Get(':restaurantId')
  @ApiOperation({ summary: 'Get all delivery locations for a restaurant' })
  @ApiResponse({ status: 200, type: [DeliveryLocation] })
  async getLocations(
    @Param('restaurantId') restaurantId: string,
  ): Promise<DeliveryLocation[]> {
    return this.restaurantService.getDeliveryLocations(restaurantId);
  }
}
