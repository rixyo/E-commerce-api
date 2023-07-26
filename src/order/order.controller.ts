import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from 'src/decoratores/role.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Roles('ADMIN')
  @Get(':storeId/findall')
  async getAllOrders(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return await this.orderService.getAllOrders(storeId);
  }
}
