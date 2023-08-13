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
import { BillboardService } from './billboard.service';
import { Roles } from '../decoratores/role.decorator';
import { createBillboardDto } from './dto/billboard.dto';

@Controller('billboard')
export class BillboardController {
  constructor(private readonly billboardService: BillboardService) {}
  @Get('')
  async getBillboards() {
    return await this.billboardService.getBillboards();
  }
  @Roles('ADMIN')
  @Post(':storeId/create')
  async createBillboard(
    @Param('storeId', new ParseUUIDPipe()) id: string,
    @Body() data: createBillboardDto,
  ) {
    return await this.billboardService.createBillboard(data, id);
  }
  @Roles('ADMIN')
  @Get(':id')
  async getBillboardById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.billboardService.getBillboardById(id);
  }
  @Roles('ADMIN')
  @Patch(':id/update')
  async updateBillboardById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: createBillboardDto,
  ) {
    return await this.billboardService.updateBillboardById(id, data);
  }
  @Get(':storeId/all')
  async findAllBillboards(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.billboardService.getAllBillboards(storeId);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteBillboardById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.billboardService.deleteBillboardById(id);
  }
}
