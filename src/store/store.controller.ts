import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/store.dto';
import { Roles } from '../decoratores/role.decorator';
import { User, userType } from '../user/decorators/user.decrator';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}
  @Roles('ADMIN')
  @Post()
  async createStore(@Body() body: CreateStoreDto, @User() user: userType) {
    return await this.storeService.createStore(body, user.userId);
  }
  @Roles('ADMIN')
  @Get('all')
  async getAllStore(@User() user: userType) {
    return await this.storeService.getAllStores(user.userId);
  }
  @Roles('ADMIN')
  @Get(':id')
  async getStoreById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.storeService.getStoreById(id);
  }
  @Roles('ADMIN')
  @Get()
  async getStoreByUserId(@User() user: userType) {
    return await this.storeService.getStoreByUserId(user.userId);
  }
  @Roles('ADMIN')
  @Patch(':id')
  async updateStore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateStoreDto,
  ) {
    return await this.storeService.updateStore(id, body);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteStore(@Param('id', ParseUUIDPipe) id: string) {
    return await this.storeService.deleteStore(id);
  }
}
