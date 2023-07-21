import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SizeService } from './size.service';
import { Roles } from 'src/decoratores/role.decorator';

@Controller('size')
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}
  @Roles('ADMIN')
  @Get('findall')
  async getAllSizes(@Param('id', ParseUUIDPipe) id: string) {
    return await this.sizeService.getAllSizes(id);
  }
}
