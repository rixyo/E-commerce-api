import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SaleService } from './sale.service';
import { Roles } from 'src/decoratores/role.decorator';

@Controller('sale')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}
  @Roles('ADMIN')
  @Get(':storeId')
  async getSaleByStoreId(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.saleService.getSalesByStore(storeId);
  }
}
