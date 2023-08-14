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
import { SizeService } from './size.service';
import { Roles } from '../decoratores/role.decorator';
import { createSizeDto } from './dto/size.dto';

@Controller('size')
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}
  @Get(':storeId/all')
  async getAllSizes(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return await this.sizeService.getAllSizes(storeId);
  }
  @Get(':id')
  async getSizeById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.sizeService.getSizeById(id);
  }
  @Roles('ADMIN')
  @Post(':storeId/create')
  async createSize(
    @Param('storeId') storeId: string,
    @Body() data: createSizeDto,
  ) {
    return await this.sizeService.createSize(data, storeId);
  }
  @Roles('ADMIN')
  @Patch(':id/update')
  async updateSizeById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: createSizeDto,
  ) {
    return await this.sizeService.updateSize(id, data);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteSizeById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.sizeService.deleteSize(id);
  }
}
