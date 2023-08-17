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
import { Roles } from '../decoratores/role.decorator';
import { createProductDto } from './dto/product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Get('result')
  async searchProduct(
    @Query('search_query') search_query: string,
    @Query('page') page: number,
  ) {
    return await this.productService.searchProducts(search_query, page, 12);
  }
  @Get(':storeId/filter')
  async filterProducts(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Query('page') page: number,
    @Query('category') category?: { name: string },
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('isFeatured') isFeatured?: boolean,
  ) {
    const price =
      maxPrice || minPrice
        ? {
            ...(minPrice && { gte: parseInt(minPrice) }),
            ...(maxPrice && { lte: parseInt(maxPrice) }),
          }
        : undefined;
    const filters = {
      ...(category && { category }),
      ...(price && { price }),
      ...(isFeatured && { isFeatured }),
    };
    return await this.productService.filterProducts(storeId, filters, page, 12);
  }
  @Get(':storeId/all')
  async getAllProducts(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return await this.productService.getAllProducts(storeId);
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
  @Delete(':storeId/:id')
  async deleteProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.productService.deleteProductById(id, storeId);
  }
  @Roles('ADMIN')
  @Patch(':storeId/:id/update')
  async updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() data: createProductDto,
  ) {
    return await this.productService.updateProduct(id, data, storeId);
  }
}
