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
import { Roles } from 'src/decoratores/role.decorator';
import { createBillboardDto } from './dto/billboard.dto';

@Controller('billboard')
export class BillboardController {
  constructor(private readonly billboardService: BillboardService) {}
  @Roles('ADMIN')
  @Post(':id/create')
  async createBillboard(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: createBillboardDto,
  ) {
    return this.billboardService.createBillboard(data.label, data.imageUrl, id);
  }
  @Roles('ADMIN')
  @Get(':id')
  async getBillboardById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.billboardService.getBillboardById(id);
  }
  @Roles('ADMIN')
  @Patch(':storeId/update/:id')
  async updateBillboardById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() data: createBillboardDto,
  ) {
    return this.billboardService.updateBillboardById(
      id,
      data.label,
      data.imageUrl,
    );
  }
  @Roles('ADMIN')
  @Get(':storeId/findAll')
  async findAllBillboards(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return this.billboardService.getAllBillboard(storeId);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteBillboardById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.billboardService.deleteBillboardById(id);
  }
}
