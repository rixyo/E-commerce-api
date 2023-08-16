import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from '../decoratores/role.decorator';
import { User, userType } from '../user/decorators/user.decrator';

interface orderUpadte {
  isDelivered: boolean;
  deliveredAt: string;
}
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Roles('USER', 'ADMIN')
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
  @Get(':storeId/all')
  async getAllOrders(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return await this.orderService.getAllOrders(storeId);
  }
  @Roles('ADMIN')
  @Get(':id')
  async getOrderById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.orderService.getOrderById(id);
  }
  @Roles('ADMIN')
  @Patch(':id/update')
  async updateOrder(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() body: orderUpadte,
  ) {
    return await this.orderService.updateOrder(orderId, body);
  }
  @Delete(':id')
  async deleteOrder(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.orderService.deleteOrder(id);
  }
}
