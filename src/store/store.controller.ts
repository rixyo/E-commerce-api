import { Body, Controller, Post } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/store.dto';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}
  @Post()
  async createStore(@Body() body: CreateStoreDto) {
    return await this.storeService.createStore(body);
  }
}
