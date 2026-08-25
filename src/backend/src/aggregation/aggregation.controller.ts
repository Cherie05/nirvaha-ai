import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { AddBinItemDto } from './dto/add-bin-item.dto';
import { ClaimRouteDto } from './dto/claim-route.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) {}

  // ── B2C: the user's Digital Bin ──────────────────────────────
  @Post('bin/add')
  @Public()
  addBinItem(@Body() body: AddBinItemDto) {
    return this.aggregationService.addBinItem(body);
  }

  @Get('bin/summary/:userId')
  @Public()
  getBinSummary(@Param('userId') userId: string) {
    return this.aggregationService.getBinSummary(userId);
  }

  @Get('bin/lifetime/:userId')
  @Public()
  getLifetime(@Param('userId') userId: string) {
    return this.aggregationService.getLifetime(userId);
  }

  /** The household asks to be collected. */
  @Post('bin/request-pickup')
  @Public()
  requestPickup(@Body() body: { userId: string }) {
    return this.aggregationService.requestPickup(body.userId);
  }

  /** The household's own collection history, one entry per trip. */
  @Get('bin/pickups/:userId')
  @Public()
  getUserPickups(@Param('userId') userId: string) {
    return this.aggregationService.getUserPickups(userId);
  }

  /**
   * Which of these scans are already in the bin, so the app can grey out
   * "Add to bin" instead of letting the same photo be counted twice.
   */
  @Get('bin/scan-ids/:userId')
  @Public()
  getBinnedScanIds(@Param('userId') userId: string) {
    return this.aggregationService.getBinnedScanIds(userId);
  }

  // ── B2B: the vendor routing interface ────────────────────────
  @Get('vendor/routes')
  @Public()
  getRoutes(@Query('minKg', new DefaultValuePipe('0')) minKg: string) {
    return this.aggregationService.getRoutes(parseFloat(minKg) || 0);
  }

  @Post('vendor/claim-route')
  @Public()
  claimRoute(@Body() body: ClaimRouteDto) {
    return this.aggregationService.claimRoute(body.zone, body.vendorId);
  }

  @Post('vendor/complete-route')
  @Public()
  completeRoute(@Body() body: ClaimRouteDto) {
    return this.aggregationService.completeRoute(body.zone, body.vendorId);
  }

  @Get('vendor/history/:vendorId')
  @Public()
  getHistory(@Param('vendorId') vendorId: string) {
    return this.aggregationService.getHistory(vendorId);
  }

  @Post('vendor/complete-pickup')
  @Public()
  completePickup(@Body() body: { pickupId: string; vendorId: string }) {
    return this.aggregationService.completePickup(body.pickupId, body.vendorId);
  }

  @Get('vendor/route/:vendorId')
  @Public()
  getRoutePath(
    @Param('vendorId') vendorId: string,
    @Query('zone') zone?: string,
    @Query('pickupId') pickupId?: string,
  ) {
    return this.aggregationService.getRoute(vendorId, zone, pickupId);
  }

  @Get('vendor/map/:vendorId')
  @Public()
  getMap(@Param('vendorId') vendorId: string) {
    return this.aggregationService.getMapData(vendorId);
  }

  @Get('vendor/claimed/:vendorId')
  @Public()
  getClaimed(@Param('vendorId') vendorId: string) {
    return this.aggregationService.getClaimedRoutes(vendorId);
  }
}
