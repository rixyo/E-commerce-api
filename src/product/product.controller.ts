import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Roles } from 'src/decoratores/role.decorator';
import { createProductDto } from './dto/product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Get(':storeId/findall')
  async getAllProducts(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
  ) {
    return await this.productService.getAllProducts(storeId, page, perPage);
  }
  @Get(':id')
  async getProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.productService.getProductById(id);
  }
  @Roles('ADMIN')
  @Post(':storeId/create')
  async createProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() body: createProductDto,
  ) {
    return await this.productService.createProduct(body, storeId);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.productService.deleteProductById(id);
  }
  @Roles('ADMIN')
  @Patch(':id/update')
  async updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: createProductDto,
  ) {
    return await this.productService.updateProductById(id, data);
  }
}
