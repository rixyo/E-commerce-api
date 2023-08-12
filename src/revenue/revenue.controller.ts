import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { Roles } from '../decoratores/role.decorator';

@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}
  @Roles('ADMIN')
  @Get(':storeId/currentmonth')
  async getRevenueByStoreIdAndTotalMonth(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.revenueService.getRevenueByStoreIdAndMonth(storeId);
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
    @Param('date') date: Date,
  ) {
    return await this.revenueService.getRevenueByStoreIdAndDate(storeId, date);
  }
}
