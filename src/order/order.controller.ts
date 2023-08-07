import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from 'src/decoratores/role.decorator';
import { User, userType } from 'src/user/decorators/user.decrator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Roles('USER')
  @Get('pendings')
  async getUserPendingOrders(@User() user: userType) {
    return await this.orderService.getUserPenddingOrders(user.userId);
  }
  @Roles('USER')
  @Get('delivered')
  async getUserDeliveredOrders(@User() user: userType) {
    return await this.orderService.getUserDeliveredOrders(user.userId);
  }
  @Roles('ADMIN')
  @Get(':storeId/findall')
  async getAllOrders(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return await this.orderService.getAllOrders(storeId);
  }
  @Roles('ADMIN')
  @Get(':id')
  async getOrderById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.orderService.getOrder(id);
  }
  @Roles('ADMIN')
  @Patch(':id/update')
  async updateOrder(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() body: { deliveredAt: Date; isDelivered: boolean },
  ) {
    return await this.orderService.updateOrder(
      orderId,
      body.deliveredAt,
      body.isDelivered,
    );
  }
}
