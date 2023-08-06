import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from 'src/decoratores/role.decorator';
import { User, userType } from 'src/user/decorators/user.decrator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Roles('ADMIN')
  @Get(':storeId/findall')
  async getAllOrders(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return await this.orderService.getAllOrders(storeId);
  }
  @Roles('USER')
  @Get('')
  async getUserOrders(@User() user: userType) {
    return await this.orderService.getUserOrders(user.userId);
  }
}
