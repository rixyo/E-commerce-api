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
import { ColorService } from './color.service';
import { Roles } from '../decoratores/role.decorator';
import { createColorDto } from './dto/color.dto';

@Controller('color')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}
  @Get(':storeId/all')
  async getAllColors(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return await this.colorService.getAllColors(storeId);
  }
  @Get(':id')
  async getColorById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.colorService.getColorById(id);
  }
  @Roles('ADMIN')
  @Post(':storeId/create')
  async createColor(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() data: createColorDto,
  ) {
    return await this.colorService.createColor(data, storeId);
  }
  @Roles('ADMIN')
  @Patch(':id')
  async updateColorById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: createColorDto,
  ) {
    return await this.colorService.updateColor(id, data);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteColorById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.colorService.deleteColor(id);
  }
}
