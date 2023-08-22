import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { Roles } from '../decoratores/role.decorator';

@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}
  @Roles('ADMIN')
  @Get(':storeId/overview')
  async getRevenueOverview(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.revenueService.graphRevenue(storeId);
  }
  @Roles('ADMIN')
  @Get(':storeId/current-month')
  async getCurrentMonthRevenue(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.revenueService.getCurrentMontRevenue(storeId);
  }
  @Roles('ADMIN')
  @Get(':storeId/last-month')
  async getLastMonthRevenue(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.revenueService.getPreviousMonthRevenue(storeId);
  }

  @Roles('ADMIN')
  @Get(':storeId')
  async getRevenueByStoreId(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.revenueService.getRevenueByStoreId(storeId);
  }
  @Roles('ADMIN')
  @Get(':storeId/:date')
  async getRevenueByStoreIdAndDate(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('date') dateString: string,
  ) {
    const date = new Date(dateString);
    return await this.revenueService.getRevenueByStoreIdAndDate(storeId, date);
  }
}
